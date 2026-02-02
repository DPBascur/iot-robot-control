import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

import { getDb } from './db';

const RESET_TOKEN_TTL_MS = 1000 * 60 * 30; // 30 min

function getSecret(): string {
  return (process.env.AUTH_SECRET || 'dev-secret-change-me').trim();
}

function base64UrlFromBuffer(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function hmacToken(token: string): string {
  return crypto.createHmac('sha256', getSecret()).update(token).digest('hex');
}

export type PasswordResetRequestResult =
  | { ok: true; token: string; expiresAt: number; userId: number; email: string | null }
  | { ok: true; token: null; expiresAt: null; userId: null; email: null };

export function requestPasswordReset(username: string): PasswordResetRequestResult {
  const ident = username.trim().toLowerCase();
  if (!ident) return { ok: true, token: null, expiresAt: null, userId: null, email: null };

  const db = getDb();

  // Limpieza ligera (best-effort)
  try {
    db.prepare('DELETE FROM password_reset_tokens WHERE expires_at < ?').run(Date.now());
  } catch {
    // noop
  }

  const user = db
    .prepare('SELECT id, email FROM users WHERE lower(username) = ? OR lower(email) = ?')
    .get(ident, ident) as undefined | { id: number; email: string | null };
  if (!user?.id) return { ok: true, token: null, expiresAt: null, userId: null, email: null };

  const token = base64UrlFromBuffer(crypto.randomBytes(32));
  const tokenHash = hmacToken(token);
  const expiresAt = Date.now() + RESET_TOKEN_TTL_MS;

  // Transacción manual para evitar problemas de typings con `db.transaction()`.
  db.exec('BEGIN');
  try {
    db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id);
    db.prepare(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?)'
    ).run(user.id, tokenHash, expiresAt, Date.now());
    db.exec('COMMIT');
  } catch (e) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // noop
    }
    throw e;
  }

  return { ok: true, token, expiresAt, userId: user.id, email: user.email || null };
}

export function resetPasswordWithToken(token: string, newPassword: string): { ok: true } | { ok: false; error: string } {
  const t = token.trim();
  const p = newPassword.trim();

  if (!t) return { ok: false, error: 'Token inválido' };
  if (p.length < 6) return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres' };

  const db = getDb();

  const tokenHash = hmacToken(t);

  const row = db
    .prepare(
      `SELECT prt.id as tokenId, prt.user_id as userId, prt.expires_at as expiresAt
       FROM password_reset_tokens prt
       WHERE prt.token_hash = ?`
    )
    .get(tokenHash) as undefined | { tokenId: number; userId: number; expiresAt: number };

  if (!row?.tokenId) return { ok: false, error: 'Token inválido o expirado' };

  if (Date.now() > row.expiresAt) {
    try {
      db.prepare('DELETE FROM password_reset_tokens WHERE id = ?').run(row.tokenId);
    } catch {
      // noop
    }
    return { ok: false, error: 'Token inválido o expirado' };
  }

  const passwordHash = bcrypt.hashSync(p, 10);

  db.exec('BEGIN');
  try {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, row.userId);
    db.prepare('DELETE FROM password_reset_tokens WHERE id = ?').run(row.tokenId);
    db.exec('COMMIT');
  } catch (e) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // noop
    }
    throw e;
  }

  return { ok: true };
}
