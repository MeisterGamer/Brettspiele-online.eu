import 'dotenv/config';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { RequestHandler } from 'express';
import { findUserById } from './db.js';

const configured = process.env.JWT_SECRET;
if (process.env.NODE_ENV === 'production' && (!configured || configured.length < 32 || configured === 'famplay_secret_jwt_key_2026' || configured.startsWith('dein_geheimer_'))) {
  throw new Error('JWT_SECRET muss im Produktivbetrieb ein zufälliger Schlüssel mit mindestens 32 Zeichen sein.');
}
export const JWT_SECRET = configured || crypto.randomBytes(48).toString('hex');

export async function authenticate(token: unknown) {
  if (typeof token !== 'string') throw new Error('Missing token');
  const claims = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  if (typeof claims === 'string' || typeof claims.userId !== 'string') throw new Error('Invalid identity');
  const user = await findUserById(claims.userId);
  if (!user || user.is_banned) throw new Error('Account unavailable');
  return user;
}

export const requireUser: RequestHandler = async (req, res, next) => {
  try {
    res.locals.user = await authenticate(req.headers.authorization?.replace(/^Bearer /, ''));
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Bitte erneut anmelden.' });
  }
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  void requireUser(req, res, () => {
    if (res.locals.user.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Administratorrechte erforderlich.' });
    } else next();
  });
};

export function rateLimit(max: number, windowMs = 60_000): RequestHandler {
  const entries = new Map<string, { count: number; until: number }>();
  const timer = setInterval(() => {
    for (const [key, value] of entries) if (value.until <= Date.now()) entries.delete(key);
  }, windowMs);
  timer.unref();
  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    let entry = entries.get(key);
    if (!entry || entry.until <= Date.now()) {
      entry = { count: 0, until: Date.now() + windowMs };
      entries.set(key, entry);
    }
    if (++entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.until - Date.now()) / 1000));
      res.status(429).json({ success: false, error: 'Zu viele Anfragen. Bitte kurz warten.' });
    } else next();
  };
}
