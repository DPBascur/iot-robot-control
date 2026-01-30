import { NextRequest, NextResponse } from 'next/server';

import { verifyUserCredentials } from '@/lib/auth';
import { createSessionCookieValue, getSessionCookieName } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as null | {
    username?: string;
    password?: string;
    remember?: boolean;
  };

  const username = (body?.username || '').trim();
  const password = (body?.password || '').trim();
  // Nota: el cliente puede enviar `remember`, pero el token está limitado a 1 día.

  if (!username || !password) {
    return NextResponse.json({ error: 'Completa usuario y contraseña' }, { status: 400 });
  }

  const auth = verifyUserCredentials(username, password);

  if (!auth) {
    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });

  const exp = Date.now() + 1000 * 60 * 60 * 24; // 1 día
  const cookieValue = await createSessionCookieValue({ u: auth.username, r: auth.role, exp });

  const forwardedProto = req.headers.get('x-forwarded-proto') || '';
  const isHttps = forwardedProto.toLowerCase() === 'https';
  const cookieName = getSessionCookieName({ secure: isHttps });

  res.cookies.set({
    name: cookieName,
    value: cookieValue,
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps,
    path: '/',
    maxAge: 60 * 60 * 24,
  });

  return res;
}
