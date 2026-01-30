import { NextRequest, NextResponse } from 'next/server';

import { getRequestSession } from '@/lib/requestAuth';
import { deleteUser, updateUser } from '@/lib/users';

export const runtime = 'nodejs';

async function requireAdmin(req: NextRequest) {
  const session = await getRequestSession(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (session.r !== 'admin') return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
  return null;
}

function parseId(params: { id: string }) {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  return id;
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const params = await ctx.params;
  const id = parseId(params);
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  const body = (await req.json().catch(() => null)) as null | {
    username?: string;
    password?: string;
    role?: 'admin' | 'user';
  };

  const username = body?.username?.trim();
  const password = body?.password?.trim();
  const role = body?.role;

  if (!username && !password && !role) {
    return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 });
  }

  try {
    const user = updateUser(id, { username, password, role });
    return NextResponse.json({ user });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'No se pudo actualizar';
    if (msg.toLowerCase().includes('unique')) {
      return NextResponse.json({ error: 'Ese usuario ya existe' }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const params = await ctx.params;
  const id = parseId(params);
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  try {
    deleteUser(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'No se pudo eliminar';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
