import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {
  findUserByEmailOrUsername,
  findUserById,
  createUser,
  updateUser,
  createVerificationToken,
  verifyTokenOrCode,
  deleteVerificationTokensForUser,
  createPasswordResetToken,
  verifyPasswordResetToken,
  deletePasswordResetTokensForUser,
  getAllUsers,
  deleteUser,
  getDatabaseStatus,
  DbUserRecord,
} from '../db.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendTestEmail, getEmailServiceStatus } from '../email.js';

export const authRouter = Router();
authRouter.use(rateLimit(40));

import { JWT_SECRET, requireAdmin, requireUser, rateLimit } from '../security.js';
const JWT_EXPIRES_IN = '7d';

const DEFAULT_AVATAR = {
  skinTone: '#FCD34D',
  hairStyle: 'spiky',
  hairColor: '#451A03',
  eyes: 'happy',
  mouth: 'smile',
  outfit: 'tshirt',
  outfitColor: '#3B82F6',
  accessory: 'none',
  flair: 'none',
};

const DEFAULT_STATS = {
  gamesPlayed: 0,
  gamesWon: 0,
  tournamentsWon: 0,
  favoriteGame: 'Mensch ärgere Dich nicht',
};

// Helper: map DB user to client UserProfile format
function formatUserResponse(u: DbUserRecord) {
  let avatar = DEFAULT_AVATAR;
  let stats = DEFAULT_STATS;
  try {
    if (u.avatar_json) avatar = JSON.parse(u.avatar_json);
  } catch (e) {}
  try {
    if (u.stats_json) stats = {...DEFAULT_STATS,...JSON.parse(u.stats_json)};
  } catch (e) {}

  return {
    id: u.id,
    name: u.username,
    email: u.email,
    role: u.role,
    familyRole: u.family_role || 'Family Member',
    clanName: u.clan_name || '',
    level: u.level || 1,
    xp: u.xp || 0,
    coins: u.coins ?? 500,
    gems: u.gems ?? 10,
    isVip: Boolean(u.is_vip),
    isBanned: Boolean(u.is_banned),
    isVerified: Boolean(u.is_verified),
    streakDays: (stats as any).streakDays ?? 0,
    lastDailyClaim: (stats as any).lastDailyClaim ?? '',
    avatar,
    stats,
    matchHistory: [],
    themeId: (stats as any).themeId,
    joinedDate: u.created_at ? new Date(u.created_at).toLocaleDateString('de-DE') : 'Heute',
  };
}

/**
 * POST /api/auth/register
 * Registers a new user into MariaDB and sends verification email via SMTP
 */
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, familyRole, clanName } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 64) {
      return res.status(400).json({ success: false, error: 'Der Benutzername muss 3 bis 64 Zeichen lang sein.' });
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.trim().length > 191) {
      return res.status(400).json({ success: false, error: 'Bitte gib eine gültige E-Mail-Adresse ein.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ success: false, error: 'Das Passwort muss mindestens 6 Zeichen lang sein.' });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    if ((familyRole !== undefined && (typeof familyRole !== 'string' || familyRole.length > 32)) || (clanName !== undefined && (typeof clanName !== 'string' || clanName.length > 64))) {
      return res.status(400).json({success:false,error:'Familienrolle oder Familienname ist ungültig bzw. zu lang.'});
    }

    // Check if user already exists in MariaDB
    const existing = await findUserByEmailOrUsername(cleanUsername) || await findUserByEmailOrUsername(cleanEmail);
    if (existing) {
      if (existing.email.toLowerCase() === cleanEmail) {
        return res.status(409).json({ success: false, error: 'Diese E-Mail-Adresse ist bereits registriert.' });
      }
      return res.status(409).json({ success: false, error: 'Dieser Benutzername ist bereits vergeben.' });
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const userId = `usr_${crypto.randomBytes(8).toString('hex')}`;
    const tokenStr = crypto.randomBytes(32).toString('hex');
    const sixDigitCode = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newRecord: DbUserRecord = {
      id: userId,
      username: cleanUsername,
      email: cleanEmail,
      password_hash: passwordHash,
      role: 'user', // Default role is user; admin is never assigned automatically
      family_role: familyRole || 'Family Member',
      clan_name: clanName || '',
      level: 1,
      xp: 0,
      coins: 500,
      gems: 10,
      is_vip: false,
      is_banned: false,
      is_verified: false,
      avatar_json: JSON.stringify(DEFAULT_AVATAR),
      stats_json: JSON.stringify(DEFAULT_STATS),
    };

    // Save into MariaDB
    await createUser(newRecord);

    // Save verification token
    await createVerificationToken({
      id: `tok_${crypto.randomBytes(6).toString('hex')}`,
      user_id: userId,
      token: tokenStr,
      code: sixDigitCode,
      expires_at: expiresAt,
    });

    // Send email via SMTP Server
    // Account creation must not wait for an unreachable mail server.
    void sendVerificationEmail(cleanEmail, cleanUsername, tokenStr, sixDigitCode).catch(error => console.error('[Verification delivery]',error));

    // Generate JWT
    const jwtToken = jwt.sign(
      { userId, username: cleanUsername, role: 'user' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      success: true,
      message: getEmailServiceStatus().configured ? 'Konto erfolgreich registriert! Die Bestätigungs-E-Mail wird versendet.' : 'Konto erfolgreich registriert! Der E-Mail-Versand ist derzeit nicht eingerichtet.',
      user: formatUserResponse(newRecord),
      token: jwtToken,
      verificationCode: process.env.NODE_ENV !== 'production' ? sixDigitCode : undefined,
    });
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') return res.status(409).json({success:false,error:'Benutzername oder E-Mail-Adresse ist bereits registriert.'});
    console.error('[Auth Register Error]:', error?.code || error?.message);
    return res.status(500).json({ success: false, error: 'Registrierungsfehler. Bitte versuche es später erneut.' });
  }
});

authRouter.patch('/profile', requireUser, async (req: Request,res: Response) => {
  try {
    const {name,clanName,familyRole,avatar,themeId} = req.body;
    if (typeof name !== 'string' || name.trim().length<3 || name.trim().length>64 || typeof clanName !== 'string' || clanName.length>64 || typeof familyRole !== 'string' || familyRole.length>32) return res.status(400).json({success:false,error:'Ungültige Profildaten (Name: 3–64 Zeichen, Familie: maximal 64 Zeichen).'});
    const owner = await findUserByEmailOrUsername(name.trim());
    if (owner && owner.id!==res.locals.user.id) return res.status(409).json({success:false,error:'Dieser Benutzername ist bereits vergeben.'});
    const updates: Partial<DbUserRecord> = {username:name.trim(),clan_name:clanName.trim(),family_role:familyRole};
    if (avatar!==undefined) {
      const keys=['skinTone','hairStyle','hairColor','eyes','mouth','outfit','outfitColor','accessory','flair'];
      if (!avatar || typeof avatar!=='object' || keys.some(key=>typeof avatar[key]!=='string' || avatar[key].length>64)) return res.status(400).json({success:false,error:'Ungültiger Avatar.'});
      updates.avatar_json=JSON.stringify(Object.fromEntries(keys.map(key=>[key,avatar[key]])));
    }
    if (themeId!==undefined) {
      if(typeof themeId!=='string' || themeId.length>64) return res.status(400).json({success:false,error:'Ungültiges Design.'});
      let stats = {}; try {stats=JSON.parse(res.locals.user.stats_json);}catch{}
      updates.stats_json=JSON.stringify({...stats,themeId});
    }
    const updated = await updateUser(res.locals.user.id,updates);
    res.json({success:true,user:formatUserResponse(updated!)});
  } catch(error: any) {res.status(error?.code==='ER_DUP_ENTRY'?409:500).json({success:false,error:'Profil konnte nicht gespeichert werden.'});}
});

authRouter.post('/resend-verification', rateLimit(3), requireUser, async (_req,res)=> {
  try {
    const user = res.locals.user as DbUserRecord;
    if(user.is_verified) return res.json({success:true,message:'Deine E-Mail ist bereits bestätigt.'});
    if(!getEmailServiceStatus().configured) return res.status(503).json({success:false,error:'Der E-Mail-Versand ist nicht eingerichtet. Bitte den Betreiber informieren.'});
    const token=crypto.randomBytes(32).toString('hex'),code=crypto.randomInt(100000,1000000).toString();
    await deleteVerificationTokensForUser(user.id);
    await createVerificationToken({id:crypto.randomUUID(),user_id:user.id,token,code,expires_at:new Date(Date.now()+86400000)});
    const delivered=await sendVerificationEmail(user.email,user.username,token,code);
    res.status(delivered?200:503).json({success:delivered,...(delivered?{message:'Bestätigungs-E-Mail gesendet.'}:{error:'E-Mail konnte nicht versendet werden. Bitte später erneut versuchen.'})});
  } catch {res.status(500).json({success:false,error:'Bestätigung konnte nicht versendet werden.'});}
});

/**
 * POST /api/auth/login
 * Validates credentials against MariaDB with bcrypt and issues JWT token
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (typeof usernameOrEmail !== 'string' || typeof password !== 'string' || !usernameOrEmail || !password || usernameOrEmail.length > 254 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ success: false, error: 'Bitte Benutzername/E-Mail und Passwort angeben.' });
    }

    const cleanIdentifier = String(usernameOrEmail).trim();
    const user = await findUserByEmailOrUsername(cleanIdentifier);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Benutzername oder Passwort ist falsch.' });
    }

    if (user.is_banned) {
      return res.status(403).json({ success: false, error: 'Dieses Spielerkonto wurde von der Administration gesperrt.' });
    }

    // Verify bcrypt password hash
    const isMatch = await bcrypt.compare(String(password), user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Benutzername oder Passwort ist falsch.' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      message: `Willkommen zurück, ${user.username}!`,
      user: formatUserResponse(user),
      token,
    });
  } catch (error: any) {
    console.error('[Auth Login Error]:', error);
    return res.status(500).json({ success: false, error: 'Anmeldefehler im Server.' });
  }
});

/**
 * GET /api/auth/me
 * Retrieves current user profile from MariaDB using JWT Bearer token
 */
authRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Nicht autorisiert. Kein Anmeldetoken vorhanden.' });
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, error: 'Ungültiges oder abgelaufenes Token. Bitte erneut anmelden.' });
    }

    const user = await findUserById(decoded.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Benutzerkonto nicht gefunden.' });
    }

    if (user.is_banned) {
      return res.status(403).json({ success: false, error: 'Dein Konto wurde gesperrt.' });
    }

    return res.json({
      success: true,
      user: formatUserResponse(user),
    });
  } catch (error: any) {
    console.error('[Auth Me Error]:', error);
    return res.status(500).json({ success: false, error: 'Fehler beim Laden des Benutzerprofils.' });
  }
});

/**
 * POST /api/auth/verify-email
 * Verifies email with 6-digit code or link token
 */
authRouter.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { codeOrToken } = req.body;
    if (typeof codeOrToken !== 'string' || !codeOrToken.trim() || codeOrToken.length > 128) {
      return res.status(400).json({ success: false, error: 'Bestätigungscode erforderlich.' });
    }

    // Short codes are scoped to the authenticated account, preventing collisions.
    let userId: string | undefined;
    if (/^\d{6}$/.test(codeOrToken.trim())) {
      try { const claims = jwt.verify(req.headers.authorization?.replace(/^Bearer /,'') || '',JWT_SECRET) as any; userId=claims.userId; }
      catch { return res.status(401).json({success:false,error:'Bitte anmelden, um einen sechsstelligen Code zu bestätigen, oder den Link aus der E-Mail öffnen.'}); }
    }
    const record = await verifyTokenOrCode(codeOrToken,userId);
    if (!record) {
      return res.status(400).json({ success: false, error: 'Ungültiger oder abgelaufener Bestätigungscode.' });
    }

    // Mark user as verified in MariaDB
    const updated = await updateUser(record.user_id, { is_verified: true });
    await deleteVerificationTokensForUser(record.user_id);

    return res.json({
      success: true,
      message: 'E-Mail erfolgreich verifiziert! Dein Konto ist nun vollständig freigeschaltet.',
      // Verification proves mailbox ownership, but does not create a login session.
      user: undefined,
    });
  } catch (error: any) {
    console.error('[Verify Email Error]:', error);
    return res.status(500).json({ success: false, error: 'Fehler bei der E-Mail-Verifizierung.' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Sends password reset email
 */
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'Bitte gib deine E-Mail-Adresse ein.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await findUserByEmailOrUsername(cleanEmail);

    // Return success to avoid email enumeration even if user not found
    if (!user) {
      return res.json({
        success: true,
        message: 'Falls ein Konto mit dieser E-Mail existiert, wurde eine Nachricht zum Zurücksetzen gesendet.',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await createPasswordResetToken(user.id, token, expiresAt);
    const delivered=await sendPasswordResetEmail(user.email, user.username, token);
    if(!delivered) return res.status(503).json({success:false,error:'Die E-Mail konnte nicht versendet werden. Bitte später erneut versuchen oder den Betreiber informieren.'});

    return res.json({
      success: true,
      message: 'Falls ein Konto mit dieser E-Mail existiert, wurde eine Nachricht zum Zurücksetzen gesendet.',
    });
  } catch (error: any) {
    console.error('[Forgot Password Error]:', error);
    return res.status(500).json({ success: false, error: 'Fehler beim Zurücksetzen des Passworts.' });
  }
});

/**
 * POST /api/auth/reset-password
 * Resets user password using token
 */
authRouter.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || typeof newPassword !== 'string' || newPassword.length < 6 || Buffer.byteLength(newPassword, 'utf8') > 72) {
      return res.status(400).json({ success: false, error: 'Ungültiges Token oder zu kurzes Passwort (min. 6 Zeichen).' });
    }

    const resetRecord = await verifyPasswordResetToken(String(token));
    if (!resetRecord) {
      return res.status(400).json({ success: false, error: 'Ungültiger oder abgelaufener Link zum Zurücksetzen.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await updateUser(resetRecord.user_id, { password_hash: passwordHash });
    await deletePasswordResetTokensForUser(resetRecord.user_id);

    return res.json({
      success: true,
      message: 'Passwort erfolgreich geändert! Du kannst dich jetzt mit deinem neuen Passwort anmelden.',
    });
  } catch (error: any) {
    console.error('[Reset Password Error]:', error);
    return res.status(500).json({ success: false, error: 'Fehler beim Ändern des Passworts.' });
  }
});

/**
 * POST /api/auth/logout
 */
authRouter.post('/logout', (_req: Request, res: Response) => {
  return res.json({ success: true, message: 'Erfolgreich abgemeldet.' });
});

/**
 * POST /api/system/test-email
 * Tests SMTP connection by sending a test email
 */
authRouter.post('/test-email', requireAdmin, async (req: Request, res: Response) => {
  const { toEmail } = req.body;
  if (!toEmail || typeof toEmail !== 'string' || !toEmail.includes('@')) {
    return res.status(400).json({ success: false, error: 'Gültige Empfänger-E-Mail erforderlich.' });
  }
  const result = await sendTestEmail(toEmail.trim());
  return res.json(result);
});

/**
 * POST /api/system/create-admin
 * Securely creates or promotes an administrator in MariaDB.
 * Requires ADMIN_SECRET matching process.env.ADMIN_SETUP_KEY or allowed if no admin exists yet.
 */
authRouter.post('/create-admin', async (req: Request, res: Response) => {
  try {
    const { username, email, password, adminSecret } = req.body;
    const expectedKey = process.env.ADMIN_SETUP_KEY;

    const allUsers = await getAllUsers();
    const existingAdmin = allUsers.find((u) => u.role === 'admin');

    if (!expectedKey || adminSecret !== expectedKey) {
      return res.status(403).json({ success: false, error: 'Ungültiger Admin-Sicherheitsschlüssel.' });
    }

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'Benutzername, E-Mail und Passwort erforderlich.' });
    }

    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await findUserByEmailOrUsername(cleanUsername) || await findUserByEmailOrUsername(cleanEmail);

    if (existing) {
      // Promote existing user to admin
      await updateUser(existing.id, { role: 'admin' });
      return res.json({ success: true, message: `Benutzer "${existing.username}" wurde zum Administrator befördert.` });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const adminRecord: DbUserRecord = {
      id: `adm_${crypto.randomBytes(8).toString('hex')}`,
      username: cleanUsername,
      email: cleanEmail,
      password_hash: passwordHash,
      role: 'admin',
      family_role: 'Family Champion',
      clan_name: 'Administration',
      level: 10,
      xp: 5000,
      coins: 9999,
      gems: 500,
      is_vip: true,
      is_banned: false,
      is_verified: true,
      avatar_json: JSON.stringify(DEFAULT_AVATAR),
      stats_json: JSON.stringify(DEFAULT_STATS),
    };

    await createUser(adminRecord);
    return res.status(201).json({
      success: true,
      message: `Administrator "${cleanUsername}" erfolgreich in MariaDB angelegt!`,
      user: formatUserResponse(adminRecord),
    });
  } catch (error: any) {
    console.error('[Create Admin Error]:', error);
    return res.status(500).json({ success: false, error: 'Fehler beim Anlegen des Administrators.' });
  }
});

/**
 * GET /api/system/users
 * Returns list of registered users for admin dashboard
 */
authRouter.get('/users', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Nicht autorisiert.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await findUserById(decoded.userId);

    if (!user || user.is_banned || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Nur Administratoren haben Zugriff auf diese Daten.' });
    }

    const users = await getAllUsers();
    return res.json({ success: true, users: users.map(formatUserResponse) });
  } catch (e: any) {
    return res.status(401).json({ success: false, error: 'Ungültige Admin-Autorisierung.' });
  }
});

authRouter.patch('/users/:id',requireAdmin,async (req,res)=> {
  try {
    const target=await findUserById(String(req.params.id));
    if(!target) return res.status(404).json({success:false,error:'Benutzer nicht gefunden.'});
    const {role,isBanned,isVip,coinsDelta}=req.body;
    const updates: Partial<DbUserRecord>={};
    if(role!==undefined) {
      if(!['admin','moderator','user'].includes(role)) return res.status(400).json({success:false,error:'Ungültige Rolle.'});
      updates.role=role;
    }
    for(const [key,value] of [['is_banned',isBanned],['is_vip',isVip]] as const) {
      if(value!==undefined) {if(typeof value!=='boolean')return res.status(400).json({success:false,error:'Ungültiger Status.'}); (updates as any)[key]=value;}
    }
    if(target.id===res.locals.user.id && (updates.is_banned || (updates.role && updates.role!=='admin'))) return res.status(409).json({success:false,error:'Du kannst dein eigenes Administratorkonto nicht sperren oder herabstufen.'});
    if(coinsDelta!==undefined) {
      if(!Number.isSafeInteger(coinsDelta) || coinsDelta<1 || coinsDelta>10000) return res.status(400).json({success:false,error:'Ungültige Münzgutschrift.'});
      updates.coins=target.coins+coinsDelta;
    }
    const updated=await updateUser(target.id,updates);
    res.json({success:true,user:formatUserResponse(updated!)});
  }catch {res.status(500).json({success:false,error:'Benutzer konnte nicht aktualisiert werden.'});}
});

/**
 * GET /api/users/lookup/:id
 * Lookup a user by ID or Username to add as a family friend
 */
authRouter.get('/lookup/:id', requireUser, async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id ? String(req.params.id).trim() : '';
    if (!rawId) {
      return res.status(400).json({ success: false, error: 'Keine Spieler-ID angegeben.' });
    }

    // Try finding by ID first
    let user = await findUserById(rawId);
    // If not found, try username
    if (!user) {
      user = await findUserByEmailOrUsername(rawId);
    }

    if (!user || user.is_banned) {
      return res.status(404).json({ success: false, error: `Kein Spieler mit der ID "${rawId}" gefunden.` });
    }

    const formatted = formatUserResponse(user);
    // Return safe public profile for friends list
    return res.json({
      success: true,
      user: {
        id: formatted.id,
        name: formatted.name,
        familyRole: formatted.familyRole,
        clanName: formatted.clanName,
        level: formatted.level,
        avatar: formatted.avatar,
        isVip: formatted.isVip,
        joinedDate: formatted.joinedDate,
      },
    });
  } catch (error: any) {
    console.error('[User Lookup Error]:', error);
    return res.status(500).json({ success: false, error: 'Fehler bei der Spielersuche.' });
  }
});

/**
 * GET /api/auth/status
 * Returns live status of MariaDB and SMTP server
 */
authRouter.get('/status', async (_req: Request, res: Response) => {
  return res.json({
    database: getDatabaseStatus(),
    email: getEmailServiceStatus(),
    authMandatory: true,
    serverTime: new Date().toISOString(),
  });
});

