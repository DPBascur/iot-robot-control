'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, resolvedTheme, setTheme } = useTheme();

  // Evitar problemas de hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="relative inline-flex h-6 w-12 items-center rounded-full border"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--border)',
          opacity: 0.7,
        }}
        aria-hidden="true"
      >
        <span
          className="inline-block h-5 w-5 rounded-full"
          style={{ backgroundColor: 'var(--card-bg)', marginLeft: 2 }}
        />
      </div>
    );
  }

  const isDark = (resolvedTheme ?? theme) === 'dark';
  const currentLabel = theme === 'system' ? 'automático' : theme;
  const nextTheme = isDark ? 'light' : 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={() => setTheme(nextTheme)}
      className="relative inline-flex h-6 w-12 items-center rounded-full border transition-colors"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: isDark ? 'var(--accent-green)' : 'var(--border)',
      }}
      aria-label={`Tema actual: ${currentLabel}. Cambiar a ${nextTheme}.`}
      title={`Tema actual: ${currentLabel}. Cambiar a ${nextTheme}.`}
    >
      <span
        className="inline-block h-5 w-5 rounded-full transition-transform"
        style={{
          backgroundColor: '#FFFFFF',
          transform: isDark ? 'translateX(24px)' : 'translateX(2px)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
        }}
      />
    </button>
  );
}
