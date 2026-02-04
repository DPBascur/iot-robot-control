import { NextRequest, NextResponse } from 'next/server';

import { getDb } from '@/lib/db';
import { getRequestSession } from '@/lib/requestAuth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await getRequestSession(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const db = getDb();
  const row = db
    .prepare('SELECT email FROM users WHERE username = ?')
    .get(session.u) as undefined | { email: string | null };

  return NextResponse.json({
    user: {
      username: session.u,
      role: session.r,
      exp: session.exp,
      email: row?.email ?? null,
    },
  });
}
