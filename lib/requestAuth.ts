import type { NextRequest } from 'next/server';

import {
  COOKIE_NAME_DEV,
  COOKIE_NAME_HOST,
  type SessionPayload,
  verifySessionCookieValue,
} from '@/lib/session';

export async function getRequestSession(req: NextRequest): Promise<SessionPayload | null> {
  const raw = req.cookies.get(COOKIE_NAME_HOST)?.value || req.cookies.get(COOKIE_NAME_DEV)?.value;
  if (!raw) return null;
  return verifySessionCookieValue(raw);
}
