'use client';

import { useEffect, useMemo, useState } from 'react';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function NetworkCard({
  ssid = 'Nombre de Red',
  strength = 78,
  bars,
}: {
  ssid?: string;
  strength?: number; // 0-100
  bars?: number[]; // 0-100 (11)
}) {
  const normalized = clamp(strength, 0, 100);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const barData = useMemo(() => {
    if (bars && bars.length > 0) return bars.map((v) => clamp(v, 0, 100));
    // Generación simple: 11 barras alrededor de la fuerza principal
    return Array.from({ length: 11 }, (_, i) => {
      const jitter = (Math.sin(i * 1.2) * 10 + Math.random() * 8) * 0.6;
      return clamp(normalized + jitter - (i % 3) * 4, 8, 100);
    });
  }, [bars, normalized]);

  return (
    <div
      className="p-6 border"
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--card-shadow)',
        animation: 'fadeUp 260ms ease-out both',
        animationDelay: '80ms',
      }}
    >
      {/* Chart Area */}
      <div
        className="p-6 mb-4"
        style={{
          backgroundColor: 'var(--panel-accent-bg)',
          borderRadius: 12,
        }}
      >
        <div className="flex items-end justify-between h-32 gap-2">
          {barData.map((height, index) => (
            <div
              key={index}
              className="flex-1 rounded-t-sm"
              style={{
                height: mounted ? `${height}%` : '0%',
                backgroundColor: 'var(--panel-bar)',
                transition: 'height 520ms cubic-bezier(0.22, 1, 0.36, 1)',
                transitionDelay: `${index * 18}ms`,
              }}
              title={`${Math.round(height)}`}
            />
          ))}
        </div>

        <div className="mt-2 flex justify-between text-xs" style={{ color: 'var(--panel-accent-label)' }}>
          <span>0</span>
          <span>20</span>
          <span>40</span>
          <span>60</span>
          <span>80</span>
          <span>100</span>
        </div>
      </div>

      {/* Stats */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Estado de Red
          </h3>
          <span className="text-sm font-medium" style={{ color: 'var(--accent-green)' }}>
            {Math.round(normalized)}% señal
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'var(--chart-blue)' }} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              SSID
            </span>
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {ssid}
          </span>
        </div>
      </div>
    </div>
  );
}
