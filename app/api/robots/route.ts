import { NextRequest, NextResponse } from 'next/server';

import { getRequestSession } from '@/lib/requestAuth';
import { listEnabledRobots } from '@/lib/robots';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // Requiere sesión (admin o user). El proxy ya lo hace, pero lo dejamos explícito.
  const session = await getRequestSession(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  return NextResponse.json({ robots: listEnabledRobots() }, { headers: { 'Cache-Control': 'no-store' } });
}
