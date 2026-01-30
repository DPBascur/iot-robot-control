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
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Backfill/migrate existing DBs that don't have `role`
  const cols = db.prepare("PRAGMA table_info('users')").all() as Array<{ name: string }>;
  const hasRole = cols.some((c) => c.name === 'role');
  if (!hasRole) {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';");
  }
}

function seedDefaultAdmin(db: SqliteDatabase) {
  const username = (process.env.DEFAULT_ADMIN_USER || DEFAULT_ADMIN_USERNAME).trim();
  const password = (process.env.DEFAULT_ADMIN_PASS || DEFAULT_ADMIN_PASSWORD).trim();

  const existing = db
    .prepare('SELECT id, role FROM users WHERE username = ?')
    .get(username) as undefined | { id: number; role: string };
  if (existing?.id) {
    if (existing.role !== 'admin') {
      db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(existing.id);
    }
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  db.prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')").run(username, passwordHash);
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
