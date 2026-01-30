'use client';

import { useMemo, useState } from 'react';

export function ProfilePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const canSave = useMemo(() => {
    return (
      !saving &&
      currentPassword.trim().length > 0 &&
      newPassword.trim().length >= 6 &&
      newPassword === confirmPassword
    );
  }, [saving, currentPassword, newPassword, confirmPassword]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    setSaving(true);
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
    }
  };

  return (
    <section
      className="p-6 border"
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Cambiar contraseña
      </h2>

      <form onSubmit={onSubmit} className="grid gap-4 max-w-xl">
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
            Contraseña actual
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="h-11 w-full rounded-md px-4 outline-none"
            style={{
              backgroundColor: 'var(--auth-input-bg)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
            Nueva contraseña
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="h-11 w-full rounded-md px-4 outline-none"
            style={{
              backgroundColor: 'var(--auth-input-bg)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
          <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            Mínimo 6 caracteres.
          </p>
        </div>

        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
            Confirmar nueva contraseña
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-11 w-full rounded-md px-4 outline-none"
            style={{
              backgroundColor: 'var(--auth-input-bg)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
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
            className="h-11 rounded-md px-4 font-semibold"
            style={{
              backgroundColor: canSave ? 'var(--btn-primary)' : 'rgba(22, 163, 74, 0.45)',
              color: '#fff',
              opacity: canSave ? 1 : 0.85,
            }}
          >
            {saving ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </div>
      </form>
    </section>
  );
}
