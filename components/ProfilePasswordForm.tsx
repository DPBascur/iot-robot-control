'use client';

import { useMemo, useState } from 'react';
import { Check, Circle, Lock } from 'lucide-react';
import { useLoading } from '@/components/LoadingProvider';

export function ProfilePasswordForm() {
  const { show, hide } = useLoading();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const newPasswordTrim = newPassword.trim();
  const meetsMin = newPasswordTrim.length >= 6;
  const meetsUpper = /[A-ZÁÉÍÓÚÜÑ]/.test(newPasswordTrim);
  const hasNumber = /\d/.test(newPasswordTrim);

  const canSave = useMemo(() => {
    return (
      !saving &&
      currentPassword.trim().length > 0 &&
      meetsMin &&
      newPassword === confirmPassword
    );
  }, [saving, currentPassword, meetsMin, newPassword, confirmPassword]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    setSaving(true);
    show('Actualizando contraseña…');
    setError(null);
    setOk(null);

    try {
      const res = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json().catch(() => null)) as null | { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data?.error || 'No se pudo cambiar la contraseña');

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOk('Contraseña actualizada');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña');
    } finally {
      setSaving(false);
      hide();
    }
  };

  return (
    <section
      className="p-6 border anim-fade-up hover-lift"
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
        Seguridad de la cuenta
      </h2>
      <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Cambia tu contraseña para mantener tu cuenta segura
      </p>

      <div className="my-6" style={{ borderTop: '1px solid var(--border)' }} />

      <form onSubmit={onSubmit} className="grid gap-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Contraseña actual
          </label>
          <div className="relative">
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Lock size={18} />
            </div>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="h-12 w-full rounded-md pl-10 pr-4 outline-none"
              style={{
                backgroundColor: 'var(--auth-input-bg)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Nueva contraseña
          </label>
          <div className="grid gap-2">
            <div className="relative">
              <div
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-12 w-full rounded-md pl-10 pr-4 outline-none"
                style={{
                  backgroundColor: 'var(--auth-input-bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <ul className="grid gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex items-center gap-2">
                {meetsMin ? (
                  <Check size={16} style={{ color: 'rgba(22, 163, 74, 0.95)' }} />
                ) : (
                  <Circle size={16} style={{ color: 'rgba(148, 163, 184, 0.95)' }} />
                )}
                <span>Mínimo 6 caracteres</span>
              </li>
              <li className="flex items-center gap-2">
                {meetsUpper ? (
                  <Check size={16} style={{ color: 'rgba(22, 163, 74, 0.95)' }} />
                ) : (
                  <Circle size={16} style={{ color: 'rgba(148, 163, 184, 0.95)' }} />
                )}
                <span>Una mayúscula</span>
              </li>
              <li className="flex items-center gap-2">
                {hasNumber ? (
                  <Check size={16} style={{ color: 'rgba(22, 163, 74, 0.95)' }} />
                ) : (
                  <Circle size={16} style={{ color: 'rgba(148, 163, 184, 0.95)' }} />
                )}
                <span>
                  Un número <span className="opacity-80">(opcional)</span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Confirmar nueva contraseña
          </label>
          <div className="relative">
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Lock size={18} />
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 w-full rounded-md pl-10 pr-4 outline-none"
              style={{
                backgroundColor: 'var(--auth-input-bg)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          {confirmPassword.length > 0 && newPassword !== confirmPassword ? (
            <p className="mt-1 text-xs" style={{ color: 'rgba(220, 38, 38, 0.95)' }}>
              No coincide.
            </p>
          ) : null}
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

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!canSave}
            className="h-12 rounded-md px-6 font-semibold pressable"
            style={{
              backgroundColor: canSave ? 'var(--btn-primary)' : 'rgba(22, 163, 74, 0.45)',
              color: '#fff',
              opacity: canSave ? 1 : 0.85,
            }}
          >
            {saving ? 'Guardando…' : 'Actualizar contraseña'}
          </button>
        </div>
      </form>
    </section>
  );
}
