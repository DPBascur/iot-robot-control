import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

import { getDb } from '@/lib/db';
import { getRequestSession } from '@/lib/requestAuth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await getRequestSession(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as null | {
    currentPassword?: string;
    newPassword?: string;
  };

  const currentPassword = (body?.currentPassword || '').trim();
  const newPassword = (body?.newPassword || '').trim();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Completa contraseña actual y nueva' }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' }, { status: 400 });
  }

  const db = getDb();
  const row = db
    .prepare('SELECT password_hash as passwordHash FROM users WHERE username = ?')
    .get(session.u) as undefined | { passwordHash: string };

  if (!row?.passwordHash) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  const ok = bcrypt.compareSync(currentPassword, row.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 401 });
  }

  const nextHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(nextHash, session.u);

  return NextResponse.json({ ok: true });
}
