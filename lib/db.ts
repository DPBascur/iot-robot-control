import fs from 'node:fs';
import path from 'node:path';

import Database, { type Database as SqliteDatabase } from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD = 'admin123';

const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'robot.sqlite');

let dbSingleton: SqliteDatabase | null = null;

function getDbPath() {
  const fromEnv = process.env.SQLITE_PATH?.trim();
  if (fromEnv) return path.isAbsolute(fromEnv) ? fromEnv : path.join(process.cwd(), fromEnv);
  return DEFAULT_DB_PATH;
}

function ensureDirectoryForFile(filePath: string) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function migrate(db: SqliteDatabase) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS robots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      robot_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
  `);

  // Backfill/migrate existing DBs that don't have newer columns
  const cols = db.prepare("PRAGMA table_info('users')").all() as Array<{ name: string }>;

  const hasRole = cols.some((c) => c.name === 'role');
  if (!hasRole) db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';");

  const hasEmail = cols.some((c) => c.name === 'email');
  if (!hasEmail) db.exec('ALTER TABLE users ADD COLUMN email TEXT;');

  // Índice único case-insensitive para email (si está presente)
  // Nota: SQLite permite múltiples NULL, así que email puede ser opcional.
  db.exec(
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower_unique ON users(lower(email)) WHERE email IS NOT NULL;"
  );
}

function seedDefaultAdmin(db: SqliteDatabase) {
  const username = (process.env.DEFAULT_ADMIN_USER || DEFAULT_ADMIN_USERNAME).trim().toLowerCase();
  const password = (process.env.DEFAULT_ADMIN_PASS || DEFAULT_ADMIN_PASSWORD).trim();

  const existing = db
    .prepare('SELECT id, role, username FROM users WHERE lower(username) = ?')
    .get(username) as undefined | { id: number; role: string; username: string };
  if (existing?.id) {
    // Normaliza username si venía con casing distinto
    // (mantiene consistencia y evita duplicados por casing)
    if (existing.username !== username) {
      db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, existing.id);
    }

    if (existing.role !== 'admin') {
      db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(existing.id);
    }
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  db.prepare("INSERT INTO users (username, email, password_hash, role) VALUES (?, NULL, ?, 'admin')").run(
    username,
    passwordHash
  );
}

export function getDb() {
  if (dbSingleton) return dbSingleton;

  const dbPath = getDbPath();
  ensureDirectoryForFile(dbPath);

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  migrate(db);
  seedDefaultAdmin(db);

  dbSingleton = db;
  return db;
}
