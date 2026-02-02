import { NextRequest, NextResponse } from 'next/server';

import { getRequestSession } from '@/lib/requestAuth';
import { createUser, listUsers } from '@/lib/users';

export const runtime = 'nodejs';

async function requireAdmin(req: NextRequest) {
  const session = await getRequestSession(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (session.r !== 'admin') return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
  return null;
}

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  return NextResponse.json({ users: listUsers() });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => null)) as null | {
    username?: string;
    email?: string;
    password?: string;
    role?: 'admin' | 'user';
  };

  const username = (body?.username || '').trim();
  const email = (body?.email || '').trim();
  const password = (body?.password || '').trim();
  const role = body?.role === 'admin' ? 'admin' : 'user';

  if (!username || !password) {
    return NextResponse.json({ error: 'Completa usuario y contraseña' }, { status: 400 });
  }

  try {
    const user = createUser(username, password, role, email || undefined);
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'No se pudo crear el usuario';
    // Unique constraint
    if (msg.toLowerCase().includes('unique')) {
      return NextResponse.json({ error: 'Ese usuario ya existe' }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
