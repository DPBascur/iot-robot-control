import { NextResponse } from 'next/server';

import { COOKIE_NAME_DEV, COOKIE_NAME_HOST } from '@/lib/session';

export async function POST() {
  const res = NextResponse.json({ ok: true });

  for (const name of [COOKIE_NAME_HOST, COOKIE_NAME_DEV]) {
    res.cookies.set({
      name,
      value: '',
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 0,
    });
    res.cookies.set({
      name,
      value: '',
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      maxAge: 0,
    });
  }

  return res;
}
