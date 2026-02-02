'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { ThemeToggle } from '@/components/ThemeToggle';
import { useLoading } from '@/components/LoadingProvider';

export default function ForgotPasswordPage() {
  const { show, hide } = useLoading();
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return username.trim().length > 0 && !submitting;
  }, [username, submitting]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    setMessage(null);
    setResetUrl(null);
    show('Generando enlace…');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = (await res.json().catch(() => null)) as null | {
        ok?: boolean;
        message?: string;
        resetUrl?: string;
      };

      if (!res.ok) {
        setError(data?.message || 'No se pudo procesar la solicitud');
        return;
      }

      setMessage(data?.message || 'Listo.');
      if (data?.resetUrl) setResetUrl(data.resetUrl);
    } catch {
      setError('Error de red. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
      hide();
    }
  };

  return (
    <main
      className="relative min-h-svh flex items-center justify-center px-4 overflow-hidden"
      style={{ background: 'var(--auth-bg)' }}
    >
      <div className="pointer-events-auto absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <section className="w-full max-w-md">
        <div
          className="border px-7 pb-7 pt-7"
          style={{
            background: 'var(--auth-card-bg)',
            borderColor: 'var(--auth-card-border)',
            borderRadius: 14,
            boxShadow: 'var(--auth-card-shadow)',
          }}
        >
          <h1 className="text-center text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Recuperar contraseña
          </h1>

          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Ingresa tu usuario o email. Si existe, se iniciará el proceso de recuperación.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <input
              type="text"
              inputMode="text"
              autoComplete="username"
              placeholder="Usuario o email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-11 w-full rounded-md px-4 outline-none"
              style={{
                backgroundColor: 'var(--auth-input-bg)',
                border: '1px solid var(--auth-input-border)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--auth-input-shadow)',
              }}
            />

            {error ? (
              <div
                className="rounded-md px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'rgba(220, 38, 38, 0.10)',
                  border: '1px solid rgba(220, 38, 38, 0.25)',
                  color: 'var(--text-primary)',
                }}
              >
                {error}
              </div>
            ) : null}

            {message ? (
              <div
                className="rounded-md px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'rgba(22, 163, 74, 0.12)',
                  border: '1px solid rgba(22, 163, 74, 0.22)',
                  color: 'var(--text-primary)',
                }}
              >
                {message}
              </div>
            ) : null}

            {resetUrl ? (
              <div className="rounded-md px-3 py-2 text-sm" style={{ border: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                  En desarrollo, aquí está tu enlace:
                </p>
                <a
                  href={resetUrl}
                  className="break-all font-semibold"
                  style={{ color: 'var(--auth-link)' }}
                >
                  {resetUrl}
                </a>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit}
              className="h-11 w-full rounded-md font-semibold"
              style={{
                backgroundColor: canSubmit ? 'var(--auth-btn-bg)' : 'var(--auth-btn-disabled-bg)',
                color: 'var(--auth-btn-fg)',
                boxShadow: 'var(--auth-btn-shadow)',
                opacity: canSubmit ? 1 : 0.7,
              }}
            >
              {submitting ? 'Enviando…' : 'Continuar'}
            </button>

            <div className="mt-2 flex items-center justify-between text-sm">
              <Link href="/login" className="font-semibold" style={{ color: 'var(--auth-link)' }}>
                Volver al login
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
