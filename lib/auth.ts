import bcrypt from 'bcryptjs';

import { getDb } from './db';

export type AuthResult = { username: string; role: 'admin' | 'user' };

export function verifyUserCredentials(username: string, password: string): AuthResult | null {
  const u = username.trim();
  const p = password.trim();
  if (!u || !p) return null;

  const db = getDb();
  const row = db
    .prepare("SELECT username, role, password_hash as passwordHash FROM users WHERE username = ?")
    .get(u) as undefined | { username: string; role: 'admin' | 'user'; passwordHash: string };

  if (!row?.passwordHash) return null;
  const ok = bcrypt.compareSync(p, row.passwordHash);
  if (!ok) return null;
  return { username: row.username, role: row.role };
}
