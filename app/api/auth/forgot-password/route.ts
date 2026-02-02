import { NextRequest, NextResponse } from 'next/server';

import { requestPasswordReset } from '@/lib/passwordReset';
import { isEmailEnabled, sendPasswordResetEmail } from '@/lib/mailer';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as null | { username?: string; identifier?: string };
  const username = (body?.identifier || body?.username || '').trim();

  // Respuesta genérica para evitar enumeración de usuarios
  if (!username) {
    return NextResponse.json(
      { ok: true, message: 'Si el usuario existe, se iniciará el proceso de recuperación.' },
      { headers: { 'cache-control': 'no-store' } }
    );
  }

  const result = requestPasswordReset(username);

  const isDev = process.env.NODE_ENV !== 'production';

  const forwardedProto = (req.headers.get('x-forwarded-proto') || '').trim();
  const proto = forwardedProto || req.nextUrl.protocol.replace(':', '') || 'http';
  const forwardedHost = (req.headers.get('x-forwarded-host') || '').trim();
  const host = forwardedHost || req.headers.get('host') || req.nextUrl.host;
  const origin = host ? `${proto}://${host}` : req.nextUrl.origin;

  if (result.token && result.email && isEmailEnabled()) {
    const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(result.token)}`;
    try {
      await sendPasswordResetEmail({
        to: result.email,
        resetUrl,
        username,
        expiresMinutes: 30,
      });
    } catch {
      // Respuesta siempre genérica para evitar enumeración.
      // Si el SMTP está mal configurado, se verá en logs del servidor.
    }
  }

  // Sin email configurado, en producción no devolvemos el token.
  if (!isDev || !result.token) {
    return NextResponse.json(
      { ok: true, message: 'Si el usuario existe, se iniciará el proceso de recuperación.' },
      { headers: { 'cache-control': 'no-store' } }
    );
  }

  const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(result.token)}`;

  return NextResponse.json(
    {
      ok: true,
      message: 'Token generado (solo desarrollo).',
      resetUrl,
      expiresAt: result.expiresAt,
    },
    { headers: { 'cache-control': 'no-store' } }
  );
}
