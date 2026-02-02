'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, UserRound } from 'lucide-react';

import { ThemeToggle } from '@/components/ThemeToggle';
import { useLoading } from '@/components/LoadingProvider';

type LoginState = {
  username: string;
  password: string;
  remember: boolean;
};

export default function LoginPage() {
  const router = useRouter();
  const { show, hide } = useLoading();
  const [showPassword, setShowPassword] = useState(false);
  const [state, setState] = useState<LoginState>({
    username: '',
    password: '',
    remember: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPath, setNextPath] = useState<string | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const next = sp.get('next');
    if (next && next.startsWith('/')) setNextPath(next);
  }, []);

  const canSubmit = useMemo(() => {
    return state.username.trim().length > 0 && state.password.trim().length > 0 && !submitting;
  }, [state.username, state.password, submitting]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    show('Iniciando sesión…');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          username: state.username,
          password: state.password,
          remember: state.remember,
        }),
      });

      const data = (await res.json().catch(() => null)) as null | { error?: string };
      if (!res.ok) {
        setError(data?.error || 'No se pudo iniciar sesión');
        return;
      }

      show('Entrando…');
      router.replace(nextPath || '/dashboard');
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
      style={{
        background: 'var(--auth-bg)',
      }}
    >
      {/* Decorative glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* Light sweep */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(110deg, rgba(34, 197, 94, 0.0) 0%, rgba(34, 197, 94, 0.12) 42%, rgba(37, 99, 235, 0.10) 50%, rgba(34, 197, 94, 0.0) 60%)',
            backgroundSize: '220% 100%',
            mixBlendMode: 'screen',
            animation: 'authSweep 9.5s linear infinite',
            filter: 'blur(0.2px)',
          }}
        />

        {/* Edge lights (blinking) */}
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            left: '6%',
            top: '10%',
            width: 260,
            height: 260,
            background: 'radial-gradient(circle at 40% 40%, rgba(34, 197, 94, 0.40) 0%, rgba(34, 197, 94, 0.0) 65%)',
            mixBlendMode: 'screen',
            animation: 'authFlicker 4.8s steps(1, end) infinite, authDrift 7.8s ease-in-out infinite',
            willChange: 'opacity, transform',
          }}
        />
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            right: '8%',
            top: '14%',
            width: 220,
            height: 220,
            background: 'radial-gradient(circle at 60% 45%, rgba(37, 99, 235, 0.34) 0%, rgba(37, 99, 235, 0.0) 65%)',
            mixBlendMode: 'screen',
            animation: 'authFlicker 5.6s steps(1, end) infinite, authDrift 8.6s ease-in-out infinite',
            animationDelay: '0.6s, 0.2s',
            willChange: 'opacity, transform',
          }}
        />
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            left: '10%',
            bottom: '10%',
            width: 240,
            height: 240,
            background: 'radial-gradient(circle at 45% 55%, rgba(34, 197, 94, 0.34) 0%, rgba(34, 197, 94, 0.0) 65%)',
            mixBlendMode: 'screen',
            animation: 'authFlicker 6.1s steps(1, end) infinite, authDrift 9.2s ease-in-out infinite',
            animationDelay: '0.2s, 0.5s',
            willChange: 'opacity, transform',
          }}
        />
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            right: '12%',
            bottom: '12%',
            width: 260,
            height: 260,
            background: 'radial-gradient(circle at 55% 60%, rgba(37, 99, 235, 0.28) 0%, rgba(37, 99, 235, 0.0) 70%)',
            mixBlendMode: 'screen',
            animation: 'authFlicker 5.2s steps(1, end) infinite, authDrift 8.2s ease-in-out infinite',
            animationDelay: '1.1s, 0.9s',
            willChange: 'opacity, transform',
          }}
        />

        {/* Subtle rotating halo */}
        <div
          className="absolute left-1/2 top-1/2 h-225 w-225 rounded-full blur-3xl"
          style={{
            background:
              'conic-gradient(from 180deg, rgba(34, 197, 94, 0.0), rgba(34, 197, 94, 0.14), rgba(37, 99, 235, 0.10), rgba(34, 197, 94, 0.0))',
            transform: 'translate3d(-50%, -50%, 0)',
            opacity: 0.55,
            animation: 'authSpin 28s linear infinite',
          }}
        />

        <div
          className="absolute left-1/2 -top-30 h-90 w-90 -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(34, 197, 94, 0.35) 0%, rgba(34, 197, 94, 0.0) 60%)',
            animation: 'authFloat 7.5s ease-in-out infinite',
          }}
        />
        <div
          className="absolute left-1/2 top-30 h-80 w-80 -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle at 60% 40%, rgba(37, 99, 235, 0.20) 0%, rgba(37, 99, 235, 0.0) 60%)',
            animation: 'authPulse 9s ease-in-out infinite',
          }}
        />
      </div>

      <div className="pointer-events-auto absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <section className="w-full max-w-md">
        <div className="relative">
          <div
            className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2"
            aria-hidden="true"
            style={{
              animation: 'popIn 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
              willChange: 'transform, opacity',
            }}
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{
                backgroundColor: 'var(--auth-icon-bg)',
                border: '1px solid var(--auth-icon-border)',
                boxShadow: 'var(--auth-glow)',
              }}
            >
              <UserRound size={26} style={{ color: 'var(--auth-icon-fg)' }} />
            </div>
          </div>

          <div
            className="border px-7 pb-7 pt-9"
            style={{
              background: 'var(--auth-card-bg)',
              borderColor: 'var(--auth-card-border)',
              borderRadius: 14,
              boxShadow: 'var(--auth-card-shadow)',
              animation: 'fadeUp 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
              animationDelay: '60ms',
              willChange: 'transform, opacity',
            }}
          >
          <h1 className="text-center text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Iniciar Sesión
          </h1>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <input
              type="text"
              inputMode="text"
              autoComplete="username"
              placeholder="Usuario"
              value={state.username}
              onChange={(e) => setState((s) => ({ ...s, username: e.target.value }))}
              className="h-11 w-full rounded-md px-4 outline-none transition-[transform,box-shadow] duration-200"
              style={{
                backgroundColor: 'var(--auth-input-bg)',
                border: '1px solid var(--auth-input-border)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--auth-input-shadow)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(34, 197, 94, 0.18)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'var(--auth-input-shadow)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Contraseña"
                value={state.password}
                onChange={(e) => setState((s) => ({ ...s, password: e.target.value }))}
                className="h-11 w-full rounded-md pl-4 pr-11 outline-none transition-[transform,box-shadow] duration-200"
                style={{
                  backgroundColor: 'var(--auth-input-bg)',
                  border: '1px solid var(--auth-input-border)',
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--auth-input-shadow)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(34, 197, 94, 0.18)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--auth-input-shadow)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md"
                style={{ color: 'var(--text-secondary)' }}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

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

            <button
              type="submit"
              disabled={!canSubmit}
              className="h-11 w-full rounded-md font-semibold transition-[transform,box-shadow] duration-150"
              style={{
                backgroundColor: canSubmit ? 'var(--auth-btn-bg)' : 'var(--auth-btn-disabled-bg)',
                color: 'var(--auth-btn-fg)',
                boxShadow: 'var(--auth-btn-shadow)',
                opacity: canSubmit ? 1 : 0.7,
              }}
              onMouseEnter={(e) => {
                if (!canSubmit) return;
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--auth-btn-hover-bg)';
              }}
              onMouseLeave={(e) => {
                if (!canSubmit) return;
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--auth-btn-bg)';
              }}
              onMouseDown={(e) => {
                if (!canSubmit) return;
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(1px) scale(0.99)';
              }}
              onMouseUp={(e) => {
                if (!canSubmit) return;
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0) scale(1)';
              }}
            >
              {submitting ? 'Ingresando…' : 'Iniciar Sesión'}
            </button>

            <div className="mt-3 flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2" style={{ color: 'var(--auth-muted)' }}>
                <input
                  type="checkbox"
                  checked={state.remember}
                  onChange={(e) => setState((s) => ({ ...s, remember: e.target.checked }))}
                  className="h-4 w-4"
                  style={{ accentColor: 'var(--accent-green)' }}
                />
                Recuérdame
              </label>

              <Link
                href="/forgot-password"
                className="font-medium"
                style={{ color: 'var(--auth-link)' }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </form>
          </div>
        </div>

      </section>
    </main>
  );
}
