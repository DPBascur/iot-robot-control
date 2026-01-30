const COOKIE_NAME_DEV = 'robot_session';
const COOKIE_NAME_PROD = '__Host-robot_session';

export type SessionRole = 'admin' | 'user';

export type SessionPayload = {
  u: string; // username
  r: SessionRole;
  exp: number; // epoch ms
};

function getSecret(): string {
  return (process.env.AUTH_SECRET || 'dev-secret-change-me').trim();
}

function toArrayBuffer(input: ArrayBuffer | ArrayBufferView): ArrayBuffer {
  if (input instanceof ArrayBuffer) return input;
  const buf = input.buffer;
  const start = input.byteOffset;
  const end = start + input.byteLength;

  if (buf instanceof ArrayBuffer) {
    return buf.slice(start, end);
  }

  // SharedArrayBuffer u otros ArrayBufferLike: copiar a ArrayBuffer
  const out = new Uint8Array(input.byteLength);
  out.set(new Uint8Array(buf as ArrayBufferLike, start, input.byteLength));
  return out.buffer;
}

function base64UrlEncode(bytes: Uint8Array): string {
  // Node (Buffer) o Edge (btoa)
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;

  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(b64, 'base64'));
  }

  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function hmacSign(message: string): Promise<Uint8Array> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('WebCrypto no disponible');

  const secret = new TextEncoder().encode(getSecret());
  const key = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign('HMAC', key, toArrayBuffer(new TextEncoder().encode(message)));
  return new Uint8Array(sig);
}

async function hmacVerify(message: string, signature: Uint8Array): Promise<boolean> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('WebCrypto no disponible');

  const secret = new TextEncoder().encode(getSecret());
  const key = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  return crypto.subtle.verify(
    'HMAC',
    key,
    toArrayBuffer(signature),
    toArrayBuffer(new TextEncoder().encode(message))
  );
}

export async function createSessionCookieValue(payload: SessionPayload): Promise<string> {
  const json = JSON.stringify(payload);
  const body = base64UrlEncode(new TextEncoder().encode(json));
  const sig = base64UrlEncode(await hmacSign(body));
  return `${body}.${sig}`;
}

export async function verifySessionCookieValue(value: string): Promise<SessionPayload | null> {
  const parts = value.split('.');
  if (parts.length !== 2) return null;

  const [body, sigB64] = parts;
  if (!body || !sigB64) return null;

  let sig: Uint8Array;
  try {
    sig = base64UrlDecode(sigB64);
  } catch {
    return null;
  }

  const ok = await hmacVerify(body, sig);
  if (!ok) return null;

  let payload: SessionPayload;
  try {
    const bytes = base64UrlDecode(body);
    const json = new TextDecoder().decode(bytes);
    payload = JSON.parse(json) as SessionPayload;
  } catch {
    return null;
  }

  if (!payload?.u || (payload.r !== 'admin' && payload.r !== 'user') || !payload.exp) return null;
  if (Date.now() > payload.exp) return null;

  return payload;
}

export function getSessionCookieName() {
  return process.env.NODE_ENV === 'production' ? COOKIE_NAME_PROD : COOKIE_NAME_DEV;
}
