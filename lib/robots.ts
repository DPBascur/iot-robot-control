import { getDb } from './db';

function normalizeRobotId(robotId: string) {
  return robotId.trim();
}

function normalizeName(name: string) {
  return name.trim();
}

function isValidRobotId(robotId: string) {
  // Permite letras/números/guiones/guion bajo/punto, 3..64 chars
  return /^[a-zA-Z0-9._-]{3,64}$/.test(robotId);
}

export type DbRobot = {
  id: number;
  robotId: string;
  name: string;
  enabled: 0 | 1;
  createdAt: string;
};

export function listRobots(): DbRobot[] {
  const db = getDb();
  return db
    .prepare(
      'SELECT id, robot_id as robotId, name, enabled, created_at as createdAt FROM robots ORDER BY id ASC'
    )
    .all() as DbRobot[];
}

export function listEnabledRobots(): Array<Pick<DbRobot, 'robotId' | 'name'>> {
  const db = getDb();
  return db
    .prepare('SELECT robot_id as robotId, name FROM robots WHERE enabled = 1 ORDER BY id ASC')
    .all() as Array<{ robotId: string; name: string }>;
}

export function createRobot(input: { robotId: string; name: string; enabled?: boolean }): DbRobot {
  const robotId = normalizeRobotId(input.robotId);
  const name = normalizeName(input.name);
  const enabled = input.enabled === false ? 0 : 1;

  if (!robotId || !name) throw new Error('Completa ID y nombre');
  if (!isValidRobotId(robotId)) throw new Error('ID inválido (usa letras/números/.-_ y 3-64 chars)');

  const db = getDb();

  const count = (db.prepare('SELECT COUNT(1) as c FROM robots').get() as { c: number }).c;
  if (count >= 2) throw new Error('Máximo 2 robots');

  const exists = db.prepare('SELECT 1 FROM robots WHERE robot_id = ?').get(robotId) as undefined | { 1: 1 };
  if (exists) throw new Error('Ese robot ya existe');

  const res = db
    .prepare('INSERT INTO robots (robot_id, name, enabled) VALUES (?, ?, ?)')
    .run(robotId, name, enabled);

  const id = Number(res.lastInsertRowid);
  return db
    .prepare(
      'SELECT id, robot_id as robotId, name, enabled, created_at as createdAt FROM robots WHERE id = ?'
    )
    .get(id) as DbRobot;
}

export function updateRobot(
  id: number,
  update: { robotId?: string; name?: string; enabled?: boolean }
): DbRobot {
  const db = getDb();
  const existing = db
    .prepare(
      'SELECT id, robot_id as robotId, name, enabled, created_at as createdAt FROM robots WHERE id = ?'
    )
    .get(id) as undefined | DbRobot;
  if (!existing) throw new Error('Robot no encontrado');

  if (typeof update.robotId === 'string') {
    const robotId = normalizeRobotId(update.robotId);
    if (!robotId) throw new Error('ID inválido');
    if (!isValidRobotId(robotId)) throw new Error('ID inválido (usa letras/números/.-_ y 3-64 chars)');
    const conflict = db
      .prepare('SELECT id FROM robots WHERE robot_id = ? AND id <> ?')
      .get(robotId, id) as undefined | { id: number };
    if (conflict?.id) throw new Error('Ese robot ya existe');

    db.prepare('UPDATE robots SET robot_id = ? WHERE id = ?').run(robotId, id);
  }

  if (typeof update.name === 'string') {
    const name = normalizeName(update.name);
    if (!name) throw new Error('Nombre inválido');
    db.prepare('UPDATE robots SET name = ? WHERE id = ?').run(name, id);
  }

  if (typeof update.enabled === 'boolean') {
    db.prepare('UPDATE robots SET enabled = ? WHERE id = ?').run(update.enabled ? 1 : 0, id);
  }

  return db
    .prepare(
      'SELECT id, robot_id as robotId, name, enabled, created_at as createdAt FROM robots WHERE id = ?'
    )
    .get(id) as DbRobot;
}

export function deleteRobot(id: number): void {
  const db = getDb();
  const res = db.prepare('DELETE FROM robots WHERE id = ?').run(id);
  if (res.changes === 0) throw new Error('Robot no encontrado');
}
