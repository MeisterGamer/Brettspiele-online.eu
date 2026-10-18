import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

export interface DbUserRecord {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'moderator' | 'user';
  family_role: string;
  clan_name: string;
  level: number;
  xp: number;
  coins: number;
  gems: number;
  is_vip: boolean;
  is_banned: boolean;
  is_verified: boolean;
  avatar_json: string;
  stats_json: string;
  created_at?: string;
  updated_at?: string;
}

export interface VerificationTokenRecord {
  id: string;
  user_id: string;
  token: string;
  code: string;
  expires_at: Date;
  created_at?: Date;
}

// MariaDB / MySQL configuration from environment variables
let DB_HOST = process.env.DB_HOST || '127.0.0.1';
let DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
let DB_USER = process.env.DB_USER || 'root';
let DB_PASSWORD = process.env.DB_PASSWORD || '';
let DB_NAME = process.env.DB_NAME || 'famplay_brettspiele';
let DB_SOCKET_PATH = process.env.DB_SOCKET_PATH || '';

let pool: mysql.Pool | null = null;
let isMariaDbConnected = false;

const INSTALLED_FILE = path.resolve('.installed');

export function checkIsInstalled(): boolean {
  try {
    return fs.existsSync(INSTALLED_FILE);
  } catch {
    return false;
  }
}

export function markAsInstalled(metadata?: any): void {
  try {
    fs.writeFileSync(
      INSTALLED_FILE,
      JSON.stringify({
        installedAt: new Date().toISOString(),
        ...metadata,
      }, null, 2),
      'utf-8'
    );
  } catch (err) {
    console.error('[Setup] Error writing .installed file:', err);
  }
}

export async function hasAdminUser(): Promise<boolean> {
  const users = await getAllUsers();
  return users.some((u) => u.role === 'admin');
}

export async function testCustomDatabaseConnection(config: {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  socketPath?: string;
}): Promise<{ success: boolean; message: string; version?: string }> {
  try {
    const baseConfig: any = config.socketPath
      ? { socketPath: config.socketPath, user: config.user, password: config.password, connectTimeout: 4000 }
      : { host: config.host || '127.0.0.1', port: Number(config.port) || 3306, user: config.user, password: config.password, connectTimeout: 4000 };

    const conn = await mysql.createConnection(baseConfig);
    const [rows]: any = await conn.query('SELECT VERSION() as version');
    await conn.end();
    const version = rows && rows[0]?.version ? String(rows[0].version) : 'MariaDB / MySQL';
    return { 
      success: true, 
      message: `Verbindung erfolgreich hergestellt! Datenbank-Version: ${version}`, 
      version 
    };
  } catch (err: any) {
    return { success: false, message: `Verbindungsfehler: ${err?.message || err}` };
  }
}

// In-Memory fallback store if MariaDB is not yet running/configured on current environment
interface MemoryStorage {
  users: Map<string, DbUserRecord>;
  verificationTokens: Map<string, VerificationTokenRecord>;
  resetTokens: Map<string, { id: string; user_id: string; token: string; expires_at: Date }>;
}

const memoryStore: MemoryStorage = {
  users: new Map(),
  verificationTokens: new Map(),
  resetTokens: new Map(),
};

// Fallback file persistence for non-MariaDB dev environments
const FALLBACK_DIR = path.resolve(process.env.FAMPLAY_DATA_DIR || '.data');
const FALLBACK_FILE = path.join(FALLBACK_DIR, 'users_fallback.json');

const loadFallback = () => {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const data = JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf-8'));
      if (Array.isArray(data)) {
        data.forEach((u: DbUserRecord) => memoryStore.users.set(u.id, u));
      }
    }
  } catch (err) {
    // ignore
  }
};

const saveFallback = () => {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) {
      fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    }
    const arr = Array.from(memoryStore.users.values());
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(arr, null, 2), 'utf-8');
  } catch (err) {
    // ignore
  }
};

loadFallback();

export async function initDatabase(customConfig?: {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  socketPath?: string;
}): Promise<boolean> {
  if (customConfig) {
    if (customConfig.host !== undefined) DB_HOST = customConfig.host;
    if (customConfig.port !== undefined) DB_PORT = Number(customConfig.port);
    if (customConfig.user !== undefined) DB_USER = customConfig.user;
    if (customConfig.password !== undefined) DB_PASSWORD = customConfig.password;
    if (customConfig.database !== undefined) DB_NAME = customConfig.database;
    if (customConfig.socketPath !== undefined) DB_SOCKET_PATH = customConfig.socketPath;
  }

  const targetDesc = DB_SOCKET_PATH ? `Socket: ${DB_SOCKET_PATH}` : `${DB_HOST}:${DB_PORT}`;
  console.log(`[Database] Attempting connection to MariaDB (${targetDesc}) as user "${DB_USER}" (database: "${DB_NAME}")...`);
  
  try {
    const baseConfig: any = DB_SOCKET_PATH
      ? { socketPath: DB_SOCKET_PATH, user: DB_USER, password: DB_PASSWORD, connectTimeout: 4000 }
      : { host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD, connectTimeout: 4000 };

    // 1. Attempt creating database if it does not exist
    try {
      const rootConn = await mysql.createConnection(baseConfig);
      await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await rootConn.end();
    } catch {
      // Ignored if user lacks CREATE DATABASE privileges or DB already exists
    }

    // 2. Establish persistent connection pool
    pool = mysql.createPool({
      ...baseConfig,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 5000,
    });

    // Test ping
    await pool.query('SELECT 1');

    // 3. Run table migrations
    await runMigrations(pool);
    isMariaDbConnected = true;
    console.log(`[Database] ✅ MariaDB successfully connected and initialized on ${targetDesc}/${DB_NAME}`);
    return true;
  } catch (error: any) {
    isMariaDbConnected = false;
    console.warn(`[Database] ⚠️ MariaDB not reachable (${error?.message || error}). Running in graceful local fallback mode.`);
    console.warn(`[Database] ℹ️ To connect MariaDB on your server, configure DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in .env`);
    return false;
  }
}

async function runMigrations(dbPool: mysql.Pool) {
  // 1. Users Table
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      username VARCHAR(64) UNIQUE NOT NULL,
      email VARCHAR(191) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin', 'moderator', 'user') DEFAULT 'user',
      family_role VARCHAR(32) DEFAULT 'Family Member',
      clan_name VARCHAR(64) DEFAULT '',
      level INT DEFAULT 1,
      xp INT DEFAULT 0,
      coins INT DEFAULT 500,
      gems INT DEFAULT 10,
      is_vip TINYINT(1) DEFAULT 0,
      is_banned TINYINT(1) DEFAULT 0,
      is_verified TINYINT(1) DEFAULT 0,
      avatar_json LONGTEXT,
      stats_json LONGTEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 2. Email Verification Tokens
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      token VARCHAR(128) NOT NULL,
      code VARCHAR(16) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_token (token),
      INDEX idx_code (code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 3. Password Reset Tokens
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      token VARCHAR(128) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_reset_token (token)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 4. Match History
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS match_history (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      game_id VARCHAR(64) NOT NULL,
      game_title VARCHAR(128) NOT NULL,
      result ENUM('won', 'lost', 'draw') NOT NULL,
      score INT DEFAULT 0,
      opponent_name VARCHAR(64) DEFAULT '',
      coins_earned INT DEFAULT 0,
      xp_earned INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

// User Database Access Functions (MariaDB with In-Memory/File fallback)

export async function findUserByEmailOrUsername(identifier: string): Promise<DbUserRecord | null> {
  const clean = identifier.trim().toLowerCase();
  if (isMariaDbConnected && pool) {
    const [rows]: any = await pool.query(
      `SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(username) = ? LIMIT 1`,
      [clean, clean]
    );
    if (rows && rows.length > 0) {
      const u = rows[0];
      return {
        ...u,
        is_vip: Boolean(u.is_vip),
        is_banned: Boolean(u.is_banned),
        is_verified: Boolean(u.is_verified),
      };
    }
    return null;
  }

  // Fallback
  for (const u of memoryStore.users.values()) {
    if (u.email.toLowerCase() === clean || u.username.toLowerCase() === clean) {
      return u;
    }
  }
  return null;
}

export async function findUserById(id: string): Promise<DbUserRecord | null> {
  if (isMariaDbConnected && pool) {
    const [rows]: any = await pool.query(`SELECT * FROM users WHERE id = ? LIMIT 1`, [id]);
    if (rows && rows.length > 0) {
      const u = rows[0];
      return {
        ...u,
        is_vip: Boolean(u.is_vip),
        is_banned: Boolean(u.is_banned),
        is_verified: Boolean(u.is_verified),
      };
    }
    return null;
  }
  return memoryStore.users.get(id) || null;
}

export async function createUser(record: DbUserRecord): Promise<DbUserRecord> {
  if (isMariaDbConnected && pool) {
    await pool.query(
      `INSERT INTO users (
        id, username, email, password_hash, role, family_role, clan_name,
        level, xp, coins, gems, is_vip, is_banned, is_verified,
        avatar_json, stats_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.username,
        record.email,
        record.password_hash,
        record.role,
        record.family_role,
        record.clan_name,
        record.level,
        record.xp,
        record.coins,
        record.gems,
        record.is_vip ? 1 : 0,
        record.is_banned ? 1 : 0,
        record.is_verified ? 1 : 0,
        record.avatar_json,
        record.stats_json,
      ]
    );
    return record;
  }

  memoryStore.users.set(record.id, record);
  saveFallback();
  return record;
}

export async function updateUser(id: string, updates: Partial<DbUserRecord>): Promise<DbUserRecord | null> {
  if (isMariaDbConnected && pool) {
    const fields: string[] = [];
    const values: any[] = [];

    for (const [key, val] of Object.entries(updates)) {
      if (['username', 'email', 'password_hash', 'role', 'family_role', 'clan_name', 'level', 'xp', 'coins', 'gems', 'avatar_json', 'stats_json'].includes(key)) {
        fields.push(`\`${key}\` = ?`);
        values.push(val);
      } else if (['is_vip', 'is_banned', 'is_verified'].includes(key)) {
        fields.push(`\`${key}\` = ?`);
        values.push(val ? 1 : 0);
      }
    }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return findUserById(id);
  }

  const existing = memoryStore.users.get(id);
  if (!existing) return null;
  const merged: DbUserRecord = { ...existing, ...updates };
  memoryStore.users.set(id, merged);
  saveFallback();
  return merged;
}

export async function createVerificationToken(record: VerificationTokenRecord): Promise<void> {
  if (isMariaDbConnected && pool) {
    await pool.query(
      `INSERT INTO email_verification_tokens (id, user_id, token, code, expires_at) VALUES (?, ?, ?, ?, ?)`,
      [record.id, record.user_id, record.token, record.code, record.expires_at]
    );
    return;
  }
  memoryStore.verificationTokens.set(record.token, record);
  memoryStore.verificationTokens.set(record.code, record);
}

export async function verifyTokenOrCode(inputTokenOrCode: string): Promise<VerificationTokenRecord | null> {
  const clean = inputTokenOrCode.trim();
  if (isMariaDbConnected && pool) {
    const [rows]: any = await pool.query(
      `SELECT * FROM email_verification_tokens WHERE (token = ? OR code = ?) AND expires_at > NOW() LIMIT 1`,
      [clean, clean]
    );
    if (rows && rows.length > 0) {
      return rows[0];
    }
    return null;
  }

  const found = memoryStore.verificationTokens.get(clean);
  if (found && new Date(found.expires_at) > new Date()) {
    return found;
  }
  return null;
}

export async function deleteVerificationTokensForUser(userId: string): Promise<void> {
  if (isMariaDbConnected && pool) {
    await pool.query(`DELETE FROM email_verification_tokens WHERE user_id = ?`, [userId]);
    return;
  }
  for (const [k, v] of memoryStore.verificationTokens.entries()) {
    if (v.user_id === userId) {
      memoryStore.verificationTokens.delete(k);
    }
  }
}

export async function createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
  const id = `rst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  if (isMariaDbConnected && pool) {
    await pool.query(
      `INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)`,
      [id, userId, token, expiresAt]
    );
    return;
  }
  memoryStore.resetTokens.set(token, { id, user_id: userId, token, expires_at: expiresAt });
}

export async function verifyPasswordResetToken(token: string): Promise<{ id: string; user_id: string } | null> {
  const clean = token.trim();
  if (isMariaDbConnected && pool) {
    const [rows]: any = await pool.query(
      `SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW() LIMIT 1`,
      [clean]
    );
    if (rows && rows.length > 0) {
      return rows[0];
    }
    return null;
  }
  const found = memoryStore.resetTokens.get(clean);
  if (found && new Date(found.expires_at) > new Date()) {
    return found;
  }
  return null;
}

export async function deletePasswordResetTokensForUser(userId: string): Promise<void> {
  if (isMariaDbConnected && pool) {
    await pool.query(`DELETE FROM password_reset_tokens WHERE user_id = ?`, [userId]);
    return;
  }
  for (const [k, v] of memoryStore.resetTokens.entries()) {
    if (v.user_id === userId) {
      memoryStore.resetTokens.delete(k);
    }
  }
}

export async function getAllUsers(): Promise<DbUserRecord[]> {
  if (isMariaDbConnected && pool) {
    const [rows]: any = await pool.query(`SELECT * FROM users ORDER BY created_at DESC`);
    return (rows || []).map((u: any) => ({
      ...u,
      is_vip: Boolean(u.is_vip),
      is_banned: Boolean(u.is_banned),
      is_verified: Boolean(u.is_verified),
    }));
  }
  return Array.from(memoryStore.users.values());
}

export async function deleteUser(id: string): Promise<boolean> {
  if (isMariaDbConnected && pool) {
    await pool.query(`DELETE FROM users WHERE id = ?`, [id]);
    await pool.query(`DELETE FROM email_verification_tokens WHERE user_id = ?`, [id]);
    await pool.query(`DELETE FROM password_reset_tokens WHERE user_id = ?`, [id]);
    return true;
  }
  const deleted = memoryStore.users.delete(id);
  saveFallback();
  return deleted;
}

export function getDatabaseStatus() {
  return {
    connected: isMariaDbConnected,
    type: isMariaDbConnected ? 'MariaDB / MySQL' : 'In-Memory Development Fallback',
    host: DB_HOST,
    port: DB_PORT,
    socket: DB_SOCKET_PATH || undefined,
    database: DB_NAME,
    usersCount: memoryStore.users.size,
  };
}
