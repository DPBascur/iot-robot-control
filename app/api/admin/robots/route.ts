import { NextRequest, NextResponse } from 'next/server';

import { getRequestSession } from '@/lib/requestAuth';
import { createRobot, listRobots } from '@/lib/robots';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await getRequestSession(req);
  if (!session || session.r !== 'admin') {
    return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
  }

  return NextResponse.json({ robots: listRobots() }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  const session = await getRequestSession(req);
  if (!session || session.r !== 'admin') {
    return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as null | {
    robotId?: string;
    name?: string;
    enabled?: boolean;
  };

  try {
    const robot = createRobot({
      robotId: (body?.robotId || '').trim(),
      name: (body?.name || '').trim(),
      enabled: body?.enabled,
    });
    return NextResponse.json({ robot }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'No se pudo crear robot' },
      { status: 400 }
    );
  }
}
