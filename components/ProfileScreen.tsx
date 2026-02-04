'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock, Mail, Shield, UserRound } from 'lucide-react';

import { ProfilePasswordForm } from '@/components/ProfilePasswordForm';

type MeResponse = {
  user: {
    username: string;
    role: 'admin' | 'user';
    exp: number;
    email?: string | null;
  };
};

function formatTimeToExp(exp: number) {
  // En este proyecto `exp` se guarda como epoch ms en la cookie de sesión.
  // Aun así, soportamos segundos por robustez.
  const expMs = exp > 1_000_000_000_000 ? exp : exp * 1000;
  const ms = expMs - Date.now();
  if (!Number.isFinite(ms)) return '—';
  if (ms <= 0) return 'expirada';

  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `en ${minutes} min`;
  if (hours < 24) return minutes > 0 ? `en ${hours} h ${minutes} min` : `en ${hours} h`;

  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `en ${days} d ${remHours} h` : `en ${days} d`;
}

function RoleLabel({ role }: { role: 'admin' | 'user' }) {
  const label = role === 'admin' ? 'Administrador' : 'Usuario';
  const bg = role === 'admin' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)';
  const border = role === 'admin' ? 'rgba(59, 130, 246, 0.22)' : 'rgba(16, 185, 129, 0.22)';

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: bg, border: `1px solid ${border}`, color: 'var(--text-primary)' }}
    >
      {label}
    </span>
  );
}

function titleCase(s: string) {
  const t = s.trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function ProfileScreen() {
  const [me, setMe] = useState<MeResponse['user'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
        if (!res.ok) throw new Error('No autorizado');
        const data = (await res.json()) as MeResponse;
        if (!cancelled) setMe(data.user);
      } catch {
        if (!cancelled) setMe(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const expiresText = useMemo(() => {
    if (!me?.exp) return '—';
    return formatTimeToExp(me.exp);
  }, [me?.exp]);

  const displayName = useMemo(() => {
    if (loading) return 'Cargando…';
    if (!me?.username) return 'Perfil';
    return titleCase(me.username);
  }, [loading, me?.username]);

  const roleText = me?.role === 'admin' ? 'Administrador' : me?.role === 'user' ? 'Usuario' : '';

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start anim-fade-in">
      <section
        className="border p-6 hover-lift lg:w-105"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="h-20 w-20 rounded-full grid place-items-center"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(16,185,129,0.18), rgba(59,130,246,0.12))',
              border: '3px solid rgba(34, 197, 94, 0.45)',
            }}
          >
            <UserRound size={34} style={{ color: 'var(--text-primary)' }} />
          </div>

          <div className="min-w-0">
            <div className="text-xl font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {displayName}
            </div>
            <div className="mt-1 flex items-center gap-3">
              {roleText ? (
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {roleText}
                </span>
              ) : null}
              {me?.role ? <RoleLabel role={me.role} /> : null}
            </div>
          </div>
        </div>

        <div className="my-6" style={{ borderTop: '1px solid var(--border)' }} />

        <div className="grid gap-3">
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-lg grid place-items-center"
              style={{ backgroundColor: 'rgba(148, 163, 184, 0.10)', border: '1px solid var(--border)' }}
            >
              <Mail size={18} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <div className="min-w-0">
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Email
              </div>
              <div className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                {loading ? '—' : me?.email || 'Sin email'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-lg grid place-items-center"
              style={{ backgroundColor: 'rgba(148, 163, 184, 0.10)', border: '1px solid var(--border)' }}
            >
              <Clock size={18} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <div className="min-w-0">
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Sesión expira
              </div>
              <div className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                {loading ? '—' : expiresText}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-lg grid place-items-center"
              style={{ backgroundColor: 'rgba(148, 163, 184, 0.10)', border: '1px solid var(--border)' }}
            >
              <Shield size={18} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <div className="min-w-0">
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Estado
              </div>
              <div className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                {loading ? '—' : me ? 'Con sesión activa' : 'Sin sesión'}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="min-w-0 flex-1">
        <ProfilePasswordForm />
      </div>
    </div>
  );
}
