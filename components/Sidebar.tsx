'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Menu, Settings, Shield, User, X } from 'lucide-react';

import { ThemeToggle } from '@/components/ThemeToggle';

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/drive', label: 'Control', icon: Settings },
    { href: '/admin', label: 'Admin', icon: Shield },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Sidebar Desktop */}
      <aside 
        className="fixed left-0 top-0 h-full w-20 flex flex-col items-center py-5 z-50"
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
              Administrador
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
              <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white overflow-hidden border-2 border-white shadow-md grid place-items-center">
                <User className="w-7 h-7 block" style={{ color: 'var(--chart-blue)' }} />
              </div>
              <div className="leading-tight">
                <p className="text-xs" style={{ color: 'var(--sidebar-text)', opacity: 0.9 }}>
                  Bienvenido,
                </p>
                <p className="text-sm font-semibold" style={{ color: 'var(--sidebar-text)' }}>
                  Administrador
                </p>
              </div>
            </div>
            </div>
          </div>
        </aside>
    </>
  );
}
