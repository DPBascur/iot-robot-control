import bcrypt from 'bcryptjs';

import { getDb } from './db';

export type DbUser = {
  id: number;
  username: string;
  role: 'admin' | 'user';
  createdAt: string;
};

export function listUsers(): DbUser[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT id, username, role, created_at as createdAt FROM users ORDER BY id ASC')
    .all() as Array<{ id: number; username: string; role: 'admin' | 'user'; createdAt: string }>;

  return rows;
}

export function createUser(username: string, password: string, role: 'admin' | 'user' = 'user'): DbUser {
  const u = username.trim();
  const p = password.trim();
  if (!u || !p) throw new Error('Completa usuario y contraseña');

  const db = getDb();
  const passwordHash = bcrypt.hashSync(p, 10);

  const r: 'admin' | 'user' = role === 'admin' ? 'admin' : 'user';
  const result = db
    .prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
    .run(u, passwordHash, r);
  const id = Number(result.lastInsertRowid);

  const row = db
    .prepare('SELECT id, username, role, created_at as createdAt FROM users WHERE id = ?')
    .get(id) as { id: number; username: string; role: 'admin' | 'user'; createdAt: string };

  return row;
}

export function updateUser(
  id: number,
  update: { username?: string; password?: string; role?: 'admin' | 'user' }
): DbUser {
  const db = getDb();
  const existing = db
    .prepare('SELECT id, username, role, created_at as createdAt FROM users WHERE id = ?')
    .get(id) as undefined | { id: number; username: string; role: 'admin' | 'user'; createdAt: string };

  if (!existing) throw new Error('Usuario no encontrado');

  const username = update.username?.trim();
  const password = update.password?.trim();
  const role = update.role;

  if (username) {
    db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, id);
  }

  if (password) {
    const passwordHash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, id);
  }

  if (role) {
    const nextRole: 'admin' | 'user' = role === 'admin' ? 'admin' : 'user';
    if (existing.role === 'admin' && nextRole !== 'admin') {
      const adminCount = (db
        .prepare("SELECT COUNT(1) as c FROM users WHERE role = 'admin'")
        .get() as { c: number }).c;
      if (adminCount <= 1) {
        throw new Error('No puedes quitar el rol al último admin');
      }
    }
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(nextRole, id);
  }

  const row = db
    .prepare('SELECT id, username, role, created_at as createdAt FROM users WHERE id = ?')
    .get(id) as { id: number; username: string; role: 'admin' | 'user'; createdAt: string };

  return row;
}

export function deleteUser(id: number): void {
  const db = getDb();

  const countRow = db.prepare('SELECT COUNT(1) as c FROM users').get() as { c: number };
  if (countRow.c <= 1) {
    throw new Error('No puedes eliminar el último usuario');
  }

  const target = db.prepare('SELECT role FROM users WHERE id = ?').get(id) as undefined | {
    role: 'admin' | 'user';
  };
  if (!target) throw new Error('Usuario no encontrado');

  if (target.role === 'admin') {
    const adminCount = (db
      .prepare("SELECT COUNT(1) as c FROM users WHERE role = 'admin'")
      .get() as { c: number }).c;
    if (adminCount <= 1) {
      throw new Error('No puedes eliminar el último admin');
    }
  }

  const res = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  if (res.changes === 0) throw new Error('Usuario no encontrado');
}
