'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Plus, RefreshCw, Trash2, UserCog } from 'lucide-react';
import { useLoading } from '@/components/LoadingProvider';

type TabKey = 'users' | 'robots';

type UserRow = {
  id: number;
  username: string;
  email: string | null;
  role: 'admin' | 'user';
  createdAt: string;
};

function formatCreatedAt(value: string) {
  // sqlite datetime('now') => 'YYYY-MM-DD HH:MM:SS' (UTC)
  const iso = value.includes('T') ? value : value.replace(' ', 'T') + 'Z';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export function AdminConsole() {
  const { show, hide } = useLoading();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [tab, setTab] = useState<TabKey>('users');

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');

  const canCreate = useMemo(() => {
    return newUsername.trim().length > 0 && newPassword.trim().length > 0 && !creating;
  }, [newUsername, newPassword, creating]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    setUsersError(null);
    show('Cargando usuarios…');
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' });
      const data = (await res.json().catch(() => null)) as null | { users?: UserRow[]; error?: string };
      if (!res.ok) throw new Error(data?.error || 'No se pudo cargar usuarios');
      setUsers(Array.isArray(data?.users) ? data!.users! : []);
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'Error al cargar usuarios');
    } finally {
      setLoadingUsers(false);
      hide();
    }
  };

  useEffect(() => {
    if (tab !== 'users') return;
    void loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;

    setCreating(true);
    setUsersError(null);
    show('Creando usuario…');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: newUsername, email: newEmail || undefined, password: newPassword, role: newRole }),
      });
      const data = (await res.json().catch(() => null)) as null | { user?: UserRow; error?: string };
      if (!res.ok) throw new Error(data?.error || 'No se pudo crear');

      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('user');
      await loadUsers();
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'Error al crear usuario');
    } finally {
      setCreating(false);
      hide();
    }
  };

  const startEdit = (u: UserRow) => {
    setEditingId(u.id);
    setEditUsername(u.username);
    setEditEmail(u.email || '');
    setEditPassword('');
    setEditRole(u.role);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditUsername('');
    setEditEmail('');
    setEditPassword('');
    setEditRole('user');
    setShowEditPassword(false);
  };

  const saveEdit = async (id: number) => {
    const username = editUsername.trim();
    const email = editEmail.trim();
    const password = editPassword.trim();

    const original = users.find((u) => u.id === id);
    const roleChanged = !!original && original.role !== editRole;
    const emailChanged = !!original && (original.email || '') !== email;
    if (!username && !emailChanged && !password && !roleChanged) return;

    setUsersError(null);
    show('Guardando cambios…');

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          username,
          email: email.length > 0 ? email : null,
          password: password || undefined,
          role: editRole,
        }),
      });

      const data = (await res.json().catch(() => null)) as null | { user?: UserRow; error?: string };
      if (!res.ok) throw new Error(data?.error || 'No se pudo actualizar');

      cancelEdit();
      await loadUsers();
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      hide();
    }
  };

  const onDelete = async (id: number, username: string) => {
    const ok = window.confirm(`Eliminar usuario "${username}"?`);
    if (!ok) return;

    setUsersError(null);
    show('Eliminando usuario…');

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const data = (await res.json().catch(() => null)) as null | { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data?.error || 'No se pudo eliminar');
      await loadUsers();
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      hide();
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector */}
      <div
        className="flex items-center gap-2 border p-2"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        {([
          { key: 'users' as const, label: 'Usuarios', icon: UserCog },
          { key: 'robots' as const, label: 'Robots', icon: RefreshCw },
        ] as const).map((t) => {
          const active = tab === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: active ? 'var(--sidebar-hover)' : 'transparent',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: active ? '1px solid var(--border)' : '1px solid transparent',
              }}
            >
              <Icon size={18} />
              <span className="text-sm font-semibold">{t.label}</span>
            </button>
          );
        })}

        <div className="flex-1" />

        {tab === 'users' ? (
          <button
            type="button"
            onClick={loadUsers}
            disabled={loadingUsers}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              opacity: loadingUsers ? 0.7 : 1,
            }}
          >
            <RefreshCw size={16} />
            <span className="text-sm font-semibold">Actualizar</span>
          </button>
        ) : null}
      </div>

      {/* Panel */}
      <section
        className="p-4 sm:p-6 border"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        {tab === 'robots' ? (
          <div>
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Gestión de Robots
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>Próximamente.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                Gestión de Usuarios
              </h2>
            </div>

            {/* Create */}
            <form
              onSubmit={onCreate}
              className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 items-end"
            >
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Usuario
                </label>
                <input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
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
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
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
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11 w-full rounded-md pl-4 pr-11 outline-none"
                    style={{
                      backgroundColor: 'var(--auth-input-bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md"
                    style={{ color: 'var(--text-secondary)' }}
                    aria-label={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    title={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Rol
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value === 'admin' ? 'admin' : 'user')}
                  className="h-11 w-full rounded-md px-4 outline-none"
                  style={{
                    backgroundColor: 'var(--auth-input-bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={!canCreate}
                className="h-11 rounded-md px-4 font-semibold inline-flex items-center gap-2 lg:col-span-1"
                style={{
                  backgroundColor: canCreate ? 'var(--btn-primary)' : 'rgba(22, 163, 74, 0.45)',
                  color: '#fff',
                  opacity: canCreate ? 1 : 0.8,
                }}
              >
                <Plus size={18} />
                Crear
              </button>
            </form>

            {usersError ? (
              <div
                className="rounded-md px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'rgba(220, 38, 38, 0.10)',
                  border: '1px solid rgba(220, 38, 38, 0.25)',
                  color: 'var(--text-primary)',
                }}
              >
                {usersError}
              </div>
            ) : null}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ color: 'var(--text-secondary)' }}>
                    <th className="text-left font-semibold pb-3">Usuario</th>
                    <th className="text-left font-semibold pb-3">Email</th>
                    <th className="text-left font-semibold pb-3">Rol</th>
                    <th className="text-left font-semibold pb-3">Creado</th>
                    <th className="text-right font-semibold pb-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={5} className="py-4" style={{ color: 'var(--text-secondary)' }}>
                        Cargando…
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4" style={{ color: 'var(--text-secondary)' }}>
                        No hay usuarios.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isEditing = editingId === u.id;
                      return (
                        <tr key={u.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                          <td className="py-3">
                            {isEditing ? (
                              <input
                                value={editUsername}
                                onChange={(e) => setEditUsername(e.target.value)}
                                className="h-10 w-full rounded-md px-3 outline-none"
                                style={{
                                  backgroundColor: 'var(--auth-input-bg)',
                                  border: '1px solid var(--border)',
                                  color: 'var(--text-primary)',
                                }}
                              />
                            ) : (
                              <span style={{ color: 'var(--text-primary)' }}>{u.username}</span>
                            )}
                          </td>

                          <td className="py-3" style={{ color: 'var(--text-secondary)' }}>
                            {isEditing ? (
                              <input
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                placeholder="email@dominio.com"
                                className="h-10 w-full rounded-md px-3 outline-none"
                                style={{
                                  backgroundColor: 'var(--auth-input-bg)',
                                  border: '1px solid var(--border)',
                                  color: 'var(--text-primary)',
                                }}
                              />
                            ) : (
                              <span>{u.email || '—'}</span>
                            )}
                          </td>

                          <td className="py-3" style={{ color: 'var(--text-secondary)' }}>
                            {isEditing ? (
                              <select
                                value={editRole}
                                onChange={(e) => setEditRole(e.target.value === 'admin' ? 'admin' : 'user')}
                                className="h-10 w-full rounded-md px-3 outline-none"
                                style={{
                                  backgroundColor: 'var(--auth-input-bg)',
                                  border: '1px solid var(--border)',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                <option value="user">Usuario</option>
                                <option value="admin">Admin</option>
                              </select>
                            ) : u.role === 'admin' ? (
                              <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold"
                                style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: 'var(--text-primary)' }}
                              >
                                Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold"
                                style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
                              >
                                Usuario
                              </span>
                            )}
                          </td>
                          <td className="py-3" style={{ color: 'var(--text-secondary)' }}>
                            {formatCreatedAt(u.createdAt)}
                          </td>
                          <td className="py-3">
                            {isEditing ? (
                              <div className="flex flex-col md:flex-row gap-2 justify-end">
                                <div className="w-full md:w-56">
                                  <div className="relative">
                                    <input
                                      type={showEditPassword ? 'text' : 'password'}
                                      value={editPassword}
                                      onChange={(e) => setEditPassword(e.target.value)}
                                      placeholder="Nueva contraseña (opcional)"
                                      className="h-10 w-full rounded-md pl-3 pr-10 outline-none"
                                      style={{
                                        backgroundColor: 'var(--auth-input-bg)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-primary)',
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowEditPassword((v) => !v)}
                                      className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-md"
                                      style={{ color: 'var(--text-secondary)' }}
                                      aria-label={showEditPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                      title={showEditPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                      {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => saveEdit(u.id)}
                                  className="h-10 rounded-md px-3 font-semibold"
                                  style={{ backgroundColor: 'var(--btn-primary)', color: '#fff' }}
                                >
                                  Guardar
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="h-10 rounded-md px-3 font-semibold border"
                                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => startEdit(u)}
                                  className="h-9 rounded-md px-3 font-semibold border"
                                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDelete(u.id, u.username)}
                                  className="h-9 rounded-md px-3 font-semibold"
                                  style={{ backgroundColor: 'rgba(220, 38, 38, 0.15)', color: 'var(--text-primary)' }}
                                  title="Eliminar"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
