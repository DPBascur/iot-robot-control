import { NextResponse } from 'next/server';

import { COOKIE_NAME_DEV, COOKIE_NAME_HOST } from '@/lib/session';

export const runtime = 'nodejs';

function clearCookie(
  res: NextResponse,
  options: { name: string; secure: boolean }
) {
  res.cookies.set({
    name: options.name,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: options.secure,
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
}

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.headers.set('Cache-Control', 'no-store');

  // Importante: no enviar múltiples Set-Cookie del MISMO nombre con atributos distintos.
  // Algunos browsers pueden quedarse con el último y dejar la cookie viva (especialmente con __Host-).
  clearCookie(res, { name: COOKIE_NAME_HOST, secure: true });
  clearCookie(res, { name: COOKIE_NAME_DEV, secure: false });

  return res;
}
