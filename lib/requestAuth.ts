import type { NextRequest } from 'next/server';

import { getSessionCookieName, type SessionPayload, verifySessionCookieValue } from '@/lib/session';

export async function getRequestSession(req: NextRequest): Promise<SessionPayload | null> {
  const name = getSessionCookieName();
  const raw = req.cookies.get(name)?.value;
  if (!raw) return null;
  return verifySessionCookieValue(raw);
}
