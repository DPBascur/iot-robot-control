import nodemailer from 'nodemailer';

function getEnv(name: string) {
  return (process.env[name] || '').trim();
}

function getSmtpConfig() {
  const host = getEnv('SMTP_HOST');
  const port = Number(getEnv('SMTP_PORT') || '0');
  const user = getEnv('SMTP_USER');
  const pass = getEnv('SMTP_PASS');
  const secureRaw = getEnv('SMTP_SECURE');
  const from = getEnv('SMTP_FROM');

  const secure = secureRaw ? secureRaw.toLowerCase() === 'true' : port === 465;

  const ok = !!host && Number.isFinite(port) && port > 0 && !!user && !!pass && !!from;
  return {
    ok,
    host,
    port,
    user,
    pass,
    secure,
    from,
  };
}

export function isEmailEnabled() {
  return getSmtpConfig().ok;
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
  username?: string;
  expiresMinutes?: number;
}) {
  const cfg = getSmtpConfig();
  if (!cfg.ok) {
    throw new Error('SMTP no configurado. Define SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS y SMTP_FROM.');
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: {
      user: cfg.user,
      pass: cfg.pass,
    },
  });

  const expiresText = typeof params.expiresMinutes === 'number' ? `${params.expiresMinutes} min` : '30 min';
  const subject = 'Restablecer contraseña';
  const safeUsername = (params.username || '').trim();

  const textLines = [
    'Se solicitó un restablecimiento de contraseña para tu cuenta.',
    safeUsername ? `Usuario: ${safeUsername}` : null,
    '',
    `Enlace (expira en ${expiresText}):`,
    params.resetUrl,
    '',
    'Si no lo solicitaste, puedes ignorar este mensaje.',
  ].filter(Boolean) as string[];

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.5; color: #0f172a;">
      <h2 style="margin: 0 0 12px;">Restablecer contraseña</h2>
      <p style="margin: 0 0 12px;">Se solicitó un restablecimiento de contraseña para tu cuenta.</p>
      ${safeUsername ? `<p style="margin: 0 0 12px;"><b>Usuario:</b> ${escapeHtml(safeUsername)}</p>` : ''}
      <p style="margin: 0 0 12px;">Este enlace expira en <b>${escapeHtml(expiresText)}</b>.</p>
      <p style="margin: 0 0 16px;">
        <a href="${escapeAttr(params.resetUrl)}" style="background:#16a34a;color:#fff;padding:10px 14px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block;">Cambiar contraseña</a>
      </p>
      <p style="margin: 0 0 12px; font-size: 12px; color: #475569;">Si el botón no funciona, copia y pega este enlace:</p>
      <p style="margin: 0 0 12px; font-size: 12px; word-break: break-all; color: #475569;">${escapeHtml(params.resetUrl)}</p>
      <p style="margin: 0; font-size: 12px; color: #475569;">Si no lo solicitaste, puedes ignorar este mensaje.</p>
    </div>
  `.trim();

  await transporter.sendMail({
    from: cfg.from,
    to: params.to,
    subject,
    text: textLines.join('\n'),
    html,
  });
}

function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttr(input: string) {
  // Para URLs en atributos
  return escapeHtml(input);
}
