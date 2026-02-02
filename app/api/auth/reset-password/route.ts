import { NextRequest, NextResponse } from 'next/server';

import { resetPasswordWithToken } from '@/lib/passwordReset';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as null | {
    token?: string;
    newPassword?: string;
  };

  const token = (body?.token || '').trim();
  const newPassword = (body?.newPassword || '').trim();

  const result = resetPasswordWithToken(token, newPassword);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400, headers: { 'cache-control': 'no-store' } });
  }

  return NextResponse.json({ ok: true }, { headers: { 'cache-control': 'no-store' } });
}
