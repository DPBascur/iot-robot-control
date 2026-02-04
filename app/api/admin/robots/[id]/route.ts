import { NextRequest, NextResponse } from 'next/server';

import { getRequestSession } from '@/lib/requestAuth';
import { deleteRobot, updateRobot } from '@/lib/robots';

export const runtime = 'nodejs';

function parseId(raw: string) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getRequestSession(req);
  if (!session || session.r !== 'admin') {
    return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
  }

  const { id: idRaw } = await ctx.params;
  const id = parseId(idRaw);
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  const body = (await req.json().catch(() => null)) as null | {
    robotId?: string;
    name?: string;
    enabled?: boolean;
  };

  try {
    const robot = updateRobot(id, {
      robotId: typeof body?.robotId === 'string' ? body.robotId : undefined,
      name: typeof body?.name === 'string' ? body.name : undefined,
      enabled: typeof body?.enabled === 'boolean' ? body.enabled : undefined,
    });

    return NextResponse.json({ robot }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'No se pudo actualizar robot';
    const status = message.includes('no encontrado') ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getRequestSession(req);
  if (!session || session.r !== 'admin') {
    return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
  }

  const { id: idRaw } = await ctx.params;
  const id = parseId(idRaw);
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  try {
    deleteRobot(id);
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'No se pudo eliminar robot';
    const status = message.includes('no encontrado') ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
