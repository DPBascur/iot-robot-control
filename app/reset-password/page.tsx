'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { ThemeToggle } from '@/components/ThemeToggle';
import { useLoading } from '@/components/LoadingProvider';

export default function ResetPasswordPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const { show, hide } = useLoading();

  const token = (sp.get('token') || '').trim();

  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      !submitting &&
      token.length > 0 &&
      newPassword.trim().length >= 6 &&
      newPassword === confirmPassword
    );
  }, [submitting, token, newPassword, confirmPassword]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    setOk(null);
    show('Actualizando contraseña…');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = (await res.json().catch(() => null)) as null | { ok?: boolean; error?: string };

      if (!res.ok) {
        setError(data?.error || 'No se pudo cambiar la contraseña');
        return;
      }

      setOk('Contraseña actualizada. Ya puedes iniciar sesión.');
      setNewPassword('');
      setConfirmPassword('');

      // UX: redirigir al login tras un breve tiempo
      setTimeout(() => {
        router.replace('/login');
      }, 900);
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
          className="border px-7 pb-7 pt-7 anim-fade-up"
          style={{
            background: 'var(--auth-card-bg)',
            borderColor: 'var(--auth-card-border)',
            borderRadius: 14,
            boxShadow: 'var(--auth-card-shadow)',
          }}
        >
          <h1 className="text-center text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Restablecer contraseña
          </h1>

          {!token ? (
            <div
              className="mt-4 rounded-md px-3 py-2 text-sm"
              style={{
                backgroundColor: 'rgba(220, 38, 38, 0.10)',
                border: '1px solid rgba(220, 38, 38, 0.25)',
                color: 'var(--text-primary)',
              }}
            >
              Falta el token. Usa el enlace completo.
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Nueva contraseña (mín. 6)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11 w-full rounded-md pl-4 pr-11 outline-none"
                style={{
                  backgroundColor: 'var(--auth-input-bg)',
                  border: '1px solid var(--auth-input-border)',
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--auth-input-shadow)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md pressable"
                style={{ color: 'var(--text-secondary)' }}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11 w-full rounded-md px-4 outline-none"
              style={{
                backgroundColor: 'var(--auth-input-bg)',
                border: '1px solid var(--auth-input-border)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--auth-input-shadow)',
              }}
            />

            {confirmPassword.length > 0 && newPassword !== confirmPassword ? (
              <div
                className="rounded-md px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'rgba(220, 38, 38, 0.10)',
                  border: '1px solid rgba(220, 38, 38, 0.25)',
                  color: 'var(--text-primary)',
                }}
              >
                No coincide.
              </div>
            ) : null}

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

            {ok ? (
              <div
                className="rounded-md px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'rgba(22, 163, 74, 0.12)',
                  border: '1px solid rgba(22, 163, 74, 0.22)',
                  color: 'var(--text-primary)',
                }}
              >
                {ok}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit}
              className="h-11 w-full rounded-md font-semibold pressable"
              style={{
                backgroundColor: canSubmit ? 'var(--auth-btn-bg)' : 'var(--auth-btn-disabled-bg)',
                color: 'var(--auth-btn-fg)',
                boxShadow: 'var(--auth-btn-shadow)',
                opacity: canSubmit ? 1 : 0.7,
              }}
            >
              {submitting ? 'Guardando…' : 'Cambiar contraseña'}
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
