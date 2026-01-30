import { NextRequest, NextResponse } from 'next/server';

import { getRequestSession } from '@/lib/requestAuth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await getRequestSession(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  return NextResponse.json({ user: { username: session.u, role: session.r, exp: session.exp } });
}
