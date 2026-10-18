import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {
  initDatabase,
  getDatabaseStatus,
  testCustomDatabaseConnection,
  checkIsInstalled,
  markAsInstalled,
  hasAdminUser,
  createUser,
  updateUser,
  findUserByEmailOrUsername,
  DbUserRecord,
} from '../db.js';
import { configureEmail, testSmtpConnection, getEmailServiceStatus } from '../email.js';

export const setupRouter = Router();
setupRouter.use(rateLimit(20));
// Installed systems must never expose configuration writes or connection probes.
setupRouter.use(async (req, res, next) => {
  if (req.path === '/status' && req.method === 'GET') return next();
  try {
    if (checkIsInstalled() || await hasAdminUser()) {
      return res.status(403).json({ success: false, error: 'Setup ist gesperrt.' });
    }
    const remote = req.socket.remoteAddress;
    const host = req.hostname;
    if (!['localhost', '127.0.0.1', '[::1]'].includes(host) || req.headers['x-forwarded-for'] || req.headers.forwarded) {
      return res.status(403).json({ success: false, error: 'Setup über SSH-Tunnel mit localhost öffnen.' });
    }
    if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remote || '')) {
      return res.status(403).json({ success: false, error: 'Setup ist nur über eine lokale Verbindung verfügbar.' });
    }
    next();
  } catch { res.status(503).json({ success: false, error: 'Setup-Status nicht verfügbar.' }); }
});

const ENV_FILE = path.resolve('.env');
import { JWT_SECRET, rateLimit } from '../security.js';

// Helper: updates or creates .env file key-value pairs
function updateEnvFile(keyValuePairs: Record<string, string>) {
  for (const value of Object.values(keyValuePairs)) {
    if (typeof value !== 'string' || /[\r\n'\\]/.test(value)) throw new Error('Ungültiger Konfigurationswert.');
  }
  let existingContent = '';
  try {
    if (fs.existsSync(ENV_FILE)) {
      existingContent = fs.readFileSync(ENV_FILE, 'utf-8');
    }
  } catch {}

  const lines = existingContent ? existingContent.split('\n') : [];
  const updatedKeys = new Set<string>();

  const newLines = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed.includes('=')) return line;
    const key = trimmed.split('=')[0].trim();
    if (key in keyValuePairs) {
      updatedKeys.add(key);
      const val = keyValuePairs[key];
      return `${key}='${val}'`;
    }
    return line;
  });

  // Append remaining keys that were not present
  for (const [key, val] of Object.entries(keyValuePairs)) {
    if (!updatedKeys.has(key)) {
      newLines.push(`${key}='${val}'`);
    }
  }

  try {
    fs.writeFileSync(ENV_FILE, newLines.join('\n') + '\n', 'utf-8');
  } catch (err) {
    console.error('[Setup] Error writing .env:', err);
    throw err;
  }
}

/**
 * GET /api/setup/status
 * Returns current installation and server readiness status
 */
setupRouter.get('/status', async (_req: Request, res: Response) => {
  const hasAdmin = await hasAdminUser();
  const installed = checkIsInstalled() || hasAdmin;

  return res.json({
    installed,
    hasAdmin,
    isMariaDbConnected: getDatabaseStatus().connected,
    database: getDatabaseStatus(),
    email: getEmailServiceStatus(),
    nodeVersion: process.version,
    platform: process.platform,
    envExists: fs.existsSync(ENV_FILE),
  });
});

/**
 * POST /api/setup/test-db
 * Tests a MariaDB connection without modifying permanent configuration
 */
setupRouter.post('/test-db', async (req: Request, res: Response) => {
  const { host, port, user, password, database, socketPath } = req.body;
  const result = await testCustomDatabaseConnection({
    host,
    port,
    user,
    password,
    database,
    socketPath,
  });
  return res.json(result);
});

/**
 * POST /api/setup/install-db
 * Initializes database schemas in MariaDB and updates environment
 */
setupRouter.post('/install-db', async (req: Request, res: Response) => {
  try {
    const { host, port, user, password, database, socketPath } = req.body;

    const success = await initDatabase({
      host: host || '127.0.0.1',
      port: Number(port) || 3306,
      user: user || 'root',
      password: password || '',
      database: database || 'famplay_brettspiele',
      socketPath: socketPath || '',
    });

    if (success) {
      updateEnvFile({
        DB_HOST: host || '127.0.0.1',
        DB_PORT: String(port || 3306),
        DB_USER: user || 'root',
        DB_PASSWORD: password || '',
        DB_NAME: database || 'famplay_brettspiele',
        DB_SOCKET_PATH: socketPath || '',
      });
      return res.json({
        success: true,
        message: 'MariaDB erfolgreich angebunden und alle Tabellen initialisiert!',
        database: getDatabaseStatus(),
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Verbindung zu MariaDB fehlgeschlagen. Bitte Zugangsdaten und Server prüfen.',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error?.message || 'DB-Installationsfehler.' });
  }
});

/**
 * POST /api/setup/test-email
 * Verifies SMTP credentials and sends a test email
 */
setupRouter.post('/test-email', async (req: Request, res: Response) => {
  const { host, port, secure, user, pass, from, toEmail } = req.body;
  if (!host || !toEmail) {
    return res.status(400).json({ success: false, message: 'SMTP-Host und Test-Empfängeradresse erforderlich.' });
  }

  const result = await testSmtpConnection({
    host,
    port: Number(port) || 587,
    secure: Boolean(secure),
    user,
    pass,
    from,
    toEmail,
  });

  return res.json(result);
});

/**
 * POST /api/setup/create-inhaber
 * Completes Web Setup: Creates Master Admin / Inhaber and locks wizard
 */
setupRouter.post('/create-inhaber', async (req: Request, res: Response) => {
  try {
    const alreadyInstalled = checkIsInstalled();
    const hasAdmin = await hasAdminUser();

    // Security guard: If already installed and has admin, block re-running setup
    if (alreadyInstalled && hasAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Die Plattform wurde bereits installiert und eingerichtet. Der Setup-Assistent ist gesperrt.',
      });
    }

    const { 
      username, 
      email, 
      password, 
      siteTitle, 
      appUrl,
      dbConfig,
      smtpConfig 
    } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Benutzername, E-Mail und Passwort für den Inhaber sind erforderlich.',
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Das Inhaber-Passwort muss mindestens 6 Zeichen lang sein.',
      });
    }

    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    // 1. Update .env with platform & service configs
    const envUpdates: Record<string, string> = {
      APP_URL: appUrl || 'https://brettspiele-online.eu',
      JWT_SECRET,
    };

    if (dbConfig) {
      if (dbConfig.host) envUpdates.DB_HOST = dbConfig.host;
      if (dbConfig.port) envUpdates.DB_PORT = String(dbConfig.port);
      if (dbConfig.user) envUpdates.DB_USER = dbConfig.user;
      if (dbConfig.password) envUpdates.DB_PASSWORD = dbConfig.password;
      if (dbConfig.database) envUpdates.DB_NAME = dbConfig.database;
      if (dbConfig.socketPath) envUpdates.DB_SOCKET_PATH = dbConfig.socketPath;
    }

    if (smtpConfig && smtpConfig.host) {
      envUpdates.SMTP_HOST = smtpConfig.host;
      envUpdates.SMTP_PORT = String(smtpConfig.port || 587);
      envUpdates.SMTP_SECURE = String(Boolean(smtpConfig.secure));
      envUpdates.SMTP_USER = smtpConfig.user || '';
      envUpdates.SMTP_PASS = smtpConfig.pass || '';
      envUpdates.SMTP_FROM = smtpConfig.from || `"FamPlay Brettspiele" <${cleanEmail}>`;
      configureEmail({
        host: smtpConfig.host,
        port: Number(smtpConfig.port) || 587,
        secure: Boolean(smtpConfig.secure),
        user: smtpConfig.user,
        pass: smtpConfig.pass,
        from: envUpdates.SMTP_FROM,
        appUrl: envUpdates.APP_URL,
      });
    }

    updateEnvFile(envUpdates);

    // 2. Hash password and insert Inhaber (Admin)
    const passwordHash = await bcrypt.hash(String(password), 10);
    const existing = await findUserByEmailOrUsername(cleanUsername) || await findUserByEmailOrUsername(cleanEmail);

    let adminRecord: DbUserRecord;

    if (existing) {
      existing.role = 'admin';
      existing.password_hash = passwordHash;
      existing.is_verified = true;
      existing.is_vip = true;
      await updateUser(existing.id, { role: 'admin', password_hash: passwordHash, is_verified: true, is_vip: true });
      adminRecord = existing;
    } else {
      adminRecord = {
        id: `inhaber_${crypto.randomBytes(8).toString('hex')}`,
        username: cleanUsername,
        email: cleanEmail,
        password_hash: passwordHash,
        role: 'admin',
        family_role: 'Family Champion',
        clan_name: 'Inhaber / Leitung',
        level: 10,
        xp: 10000,
        coins: 10000,
        gems: 500,
        is_vip: true,
        is_banned: false,
        is_verified: true,
        avatar_json: JSON.stringify({
          skinTone: '#FCD34D',
          hairStyle: 'spiky',
          hairColor: '#451A03',
          eyes: 'sparkle',
          mouth: 'smile',
          outfit: 'royal',
          outfitColor: '#4F46E5',
          accessory: 'crown',
          flair: 'gold-vip',
        }),
        stats_json: JSON.stringify({
          gamesPlayed: 0,
          gamesWon: 0,
          tournamentsWon: 0,
          favoriteGame: 'Mensch ärgere Dich nicht',
        }),
      };
      await createUser(adminRecord);
    }

    // 3. Mark platform as officially installed
    markAsInstalled({
      ownerUsername: cleanUsername,
      ownerEmail: cleanEmail,
      siteTitle: siteTitle || 'FamPlay Brettspiele',
      installedAt: new Date().toISOString(),
    });

    console.log(`[Setup] 🎉 Installation erfolgreich abgeschlossen! Inhaber: ${cleanUsername} (${cleanEmail})`);

    // 4. Generate initial JWT token for the owner
    const token = jwt.sign(
      { userId: adminRecord.id, username: cleanUsername, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'FamPlay wurde erfolgreich installiert und konfiguriert! Du kannst dich jetzt anmelden.',
      user: {
        id: adminRecord.id,
        name: adminRecord.username,
        email: adminRecord.email,
        role: 'admin',
        familyRole: adminRecord.family_role,
        clanName: adminRecord.clan_name,
        level: adminRecord.level,
        xp: adminRecord.xp,
        coins: adminRecord.coins,
        gems: adminRecord.gems,
        isVip: true,
        isBanned: false,
        isVerified: true,
        avatar: JSON.parse(adminRecord.avatar_json),
        stats: JSON.parse(adminRecord.stats_json),
        matchHistory: [],
        joinedDate: 'Heute',
      },
      token,
    });
  } catch (error: any) {
    console.error('[Setup Inhaber Error]:', error);
    return res.status(500).json({ success: false, error: 'Fehler beim Fertigstellen der Installation.' });
  }
});
