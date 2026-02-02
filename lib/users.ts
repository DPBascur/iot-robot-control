import bcrypt from 'bcryptjs';

import { getDb } from './db';

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  // Validación básica (suficiente para UI/admin). El proveedor SMTP validará entrega real.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export type DbUser = {
  id: number;
  username: string;
  email: string | null;
  role: 'admin' | 'user';
  createdAt: string;
};

export function listUsers(): DbUser[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT id, username, email, role, created_at as createdAt FROM users ORDER BY id ASC')
    .all() as Array<{ id: number; username: string; email: string | null; role: 'admin' | 'user'; createdAt: string }>;

  return rows;
}

export function createUser(
  username: string,
  password: string,
  role: 'admin' | 'user' = 'user',
  email?: string
): DbUser {
  const u = normalizeUsername(username);
  const p = password.trim();
  const e = email?.trim() ? normalizeEmail(email) : null;
  if (!u || !p) throw new Error('Completa usuario y contraseña');
  if (e && !isValidEmail(e)) throw new Error('Email inválido');

  const db = getDb();

  const exists = db
    .prepare('SELECT 1 FROM users WHERE lower(username) = ?')
    .get(u) as undefined | { 1: 1 };
  if (exists) throw new Error('Ese usuario ya existe');

  if (e) {
    const emailExists = db
      .prepare('SELECT 1 FROM users WHERE lower(email) = ?')
      .get(e) as undefined | { 1: 1 };
    if (emailExists) throw new Error('Ese email ya existe');
  }

  const passwordHash = bcrypt.hashSync(p, 10);

  const r: 'admin' | 'user' = role === 'admin' ? 'admin' : 'user';
  const result = db
    .prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(u, e, passwordHash, r);
  const id = Number(result.lastInsertRowid);

  const row = db
    .prepare('SELECT id, username, email, role, created_at as createdAt FROM users WHERE id = ?')
    .get(id) as { id: number; username: string; email: string | null; role: 'admin' | 'user'; createdAt: string };

  return row;
}

export function updateUser(
  id: number,
  update: { username?: string; email?: string | null; password?: string; role?: 'admin' | 'user' }
): DbUser {
  const db = getDb();
  const existing = db
    .prepare('SELECT id, username, email, role, created_at as createdAt FROM users WHERE id = ?')
    .get(id) as undefined | { id: number; username: string; email: string | null; role: 'admin' | 'user'; createdAt: string };

  if (!existing) throw new Error('Usuario no encontrado');

  const username = update.username ? normalizeUsername(update.username) : undefined;
  const email =
    update.email === null
      ? null
      : typeof update.email === 'string' && update.email.trim().length > 0
        ? normalizeEmail(update.email)
        : undefined;
  const password = update.password?.trim();
  const role = update.role;

  if (username) {
    const conflict = db
      .prepare('SELECT id FROM users WHERE lower(username) = ? AND id <> ?')
      .get(username, id) as undefined | { id: number };
    if (conflict?.id) throw new Error('Ese usuario ya existe');

    db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, id);
  }

  if (email !== undefined) {
    if (email && !isValidEmail(email)) throw new Error('Email inválido');
    if (email) {
      const conflict = db
        .prepare('SELECT id FROM users WHERE lower(email) = ? AND id <> ?')
        .get(email, id) as undefined | { id: number };
      if (conflict?.id) throw new Error('Ese email ya existe');
    }
    db.prepare('UPDATE users SET email = ? WHERE id = ?').run(email, id);
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
    .prepare('SELECT id, username, email, role, created_at as createdAt FROM users WHERE id = ?')
    .get(id) as { id: number; username: string; email: string | null; role: 'admin' | 'user'; createdAt: string };

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
