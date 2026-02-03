'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Menu, Settings, Shield, User, X } from 'lucide-react';

import { ThemeToggle } from '@/components/ThemeToggle';
import { useLoading } from '@/components/LoadingProvider';

export function Sidebar() {
  const { show, hide } = useLoading();
  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [me, setMe] = useState<null | { username: string; role: 'admin' | 'user' }>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const data = (await res.json().catch(() => null)) as null | {
          user?: { username?: string; role?: 'admin' | 'user' };
        };
        if (!res.ok) return;
        const username = (data?.user?.username || '').trim();
        const role = data?.user?.role === 'admin' ? 'admin' : 'user';
        if (!cancelled && username) setMe({ username, role });
      } catch {
        // noop
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const navItems = useMemo(() => {
    const items = [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/drive', label: 'Control', icon: Settings },
      { href: '/profile', label: 'Perfil', icon: User },
    ];
    if (me?.role === 'admin') items.push({ href: '/admin', label: 'Admin', icon: Shield });
    return items;
  }, [me?.role]);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname?.startsWith(href);
  };

  const onLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    show('Cerrando sesión…');
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        cache: 'no-store',
        credentials: 'include',
      });
    } finally {
      setIsOpen(false);
      router.replace('/login');
      setLoggingOut(false);
      hide();
    }
  };

  return (
    <>
      {/* Topbar Mobile */}
      <header
        className="sm:hidden fixed left-0 top-0 right-0 z-50 flex h-14 items-center justify-between px-3"
        style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text)' }}
      >
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--sidebar-text)' }}
          aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--sidebar-text)', opacity: loggingOut ? 0.7 : 1 }}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Sidebar Desktop */}
      <aside 
        className="hidden sm:flex fixed left-0 top-0 h-full w-20 flex-col items-center py-5 z-50"
        style={{ backgroundColor: 'var(--sidebar-bg)' }}
      >
        {/* Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 rounded-lg transition-colors"
          style={{ color: 'var(--sidebar-text)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>

        {/* Theme toggle (siempre visible) */}
        <div
          className="mt-3 p-2 rounded-lg"
          style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}
          aria-label="Tema"
        >
          <ThemeToggle />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Logout (compact) */}
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="mb-4 p-3 rounded-lg transition-colors"
          style={{ color: 'var(--sidebar-text)', opacity: loggingOut ? 0.7 : 1 }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <LogOut size={22} />
        </button>

        {/* Avatar */}
        <div className="pb-1">
          <div className="w-12 h-12 rounded-full bg-white overflow-hidden border-2 border-white shadow-md grid place-items-center">
            <User className="w-7 h-7 block" style={{ color: 'var(--chart-blue)' }} />
          </div>
          <div className="mt-2 text-center leading-tight">
            <p className="text-[9px]" style={{ color: 'var(--sidebar-text)', opacity: 0.9 }}>
              Bienvenido,
            </p>
            <p className="text-[9px] font-medium" style={{ color: 'var(--sidebar-text)' }}>
              {me?.username || '…'}
            </p>
            <p className="text-[9px]" style={{ color: 'var(--sidebar-text)', opacity: 0.75 }}>
              {me?.role === 'admin' ? 'Admin' : 'Usuario'}
            </p>
          </div>
        </div>
      </aside>

      {/* Overlay (animated) */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-200"
        style={{
          backgroundColor: 'rgba(0,0,0,0.40)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        onClick={() => setIsOpen(false)}
        aria-hidden={!isOpen}
      />

      {/* Expanded Drawer (animated) */}
      <aside
        className="fixed left-0 top-0 h-full w-64 z-60 flex flex-col transition-[transform,opacity] duration-200 ease-out"
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          color: 'var(--sidebar-text)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-110%)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        aria-label="Panel de navegación"
        aria-hidden={!isOpen}
      >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'var(--sidebar-hover)' }}
          >
            <span className="text-sm font-semibold" style={{ color: 'var(--sidebar-text)' }}>
              Panel IOT-ROBOT
            </span>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--sidebar-text)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Nav */}
          <nav className="px-3 mt-3 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors"
                  style={{
                    backgroundColor: active ? 'var(--sidebar-hover)' : 'transparent',
                    color: 'var(--sidebar-text)',
                    boxShadow: active ? 'inset 0 0 0 1px rgba(255,255,255,0.10)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Icon size={18} />
                  <span className="text-sm font-semibold">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer user */}
          <div className="mt-auto px-4 pb-4">
            <div className="border-t pt-4" style={{ borderColor: 'var(--sidebar-hover)' }}>
              <button
                type="button"
                onClick={onLogout}
                disabled={loggingOut}
                className="mb-4 flex w-full items-center gap-3 rounded-lg px-3 py-3 transition-colors"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--sidebar-text)',
                  opacity: loggingOut ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <LogOut size={18} />
                <span className="text-sm font-semibold">{loggingOut ? 'Cerrando…' : 'Cerrar sesión'}</span>
              </button>

              <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white overflow-hidden border-2 border-white shadow-md grid place-items-center">
                <User className="w-7 h-7 block" style={{ color: 'var(--chart-blue)' }} />
              </div>
              <div className="leading-tight">
                <p className="text-xs" style={{ color: 'var(--sidebar-text)', opacity: 0.9 }}>
                  Bienvenido,
                </p>
                <p className="text-sm font-semibold" style={{ color: 'var(--sidebar-text)' }}>
                  {me?.username || '…'}
                </p>
                <p className="text-xs" style={{ color: 'var(--sidebar-text)', opacity: 0.75 }}>
                  {me?.role === 'admin' ? 'Admin' : 'Usuario'}
                </p>
              </div>
            </div>
            </div>
          </div>
        </aside>
    </>
  );
}
