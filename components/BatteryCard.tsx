'use client';

import { useEffect, useMemo, useState } from 'react';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function batteryVoltageFromPercent(percent: number) {
  // Aproximación lineal típica para LiPo 3S (solo visual)
  const p = clamp(percent, 0, 100) / 100;
  return 11.0 + p * (12.6 - 11.0);
}

export function BatteryCard({
  batteryPercent = 93,
  temperatureC = 25,
  updatedAt,
}: {
  batteryPercent?: number;
  temperatureC?: number;
  updatedAt?: number;
}) {
  const target = clamp(batteryPercent, 0, 100);
  const [display, setDisplay] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let rafId = 0;
    const start = performance.now();
    const startValue = display;
    const durationMs = 900;

    const tick = (now: number) => {
      const t = clamp((now - start) / durationMs, 0, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const next = startValue + (target - startValue) * eased;
      setDisplay(next);
      if (t < 1) rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const percentage = clamp(display, 0, 100);
  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = useMemo(() => {
    return circumference - (percentage / 100) * circumference;
  }, [circumference, percentage]);

  const voltage = useMemo(() => round(batteryVoltageFromPercent(target), 2), [target]);
  const temp = useMemo(() => round(temperatureC, 1), [temperatureC]);
  const lastUpdateLabel = useMemo(() => {
    if (!mounted) return '—';
    if (!updatedAt) return '—';
    const seconds = Math.max(0, Math.round((Date.now() - updatedAt) / 1000));
    return seconds <= 1 ? 'hace 1s' : `hace ${seconds}s`;
  }, [mounted, updatedAt]);

  return (
    <div 
      className="p-6 border"
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--card-shadow)',
        animation: 'fadeUp 260ms ease-out both',
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Batería</h3>
        <button 
          className="hover:opacity-70 transition-opacity"
          style={{ color: 'var(--text-secondary)' }}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      <div className="flex items-center justify-between">
        {/* Left side - Stats */}
        <div className="space-y-4">
          <div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Voltaje estimado</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{voltage} V</p>
          </div>
          <div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Temperatura</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{temp} °C</p>
          </div>
          <div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Última telemetría</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{lastUpdateLabel}</p>
          </div>
        </div>

        {/* Right side - Circular Gauge */}
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="batteryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--accent-green-soft)" />
                <stop offset="100%" stopColor="var(--accent-green)" />
              </linearGradient>
            </defs>
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r="80"
              stroke="var(--border)"
              strokeWidth="12"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r="80"
              stroke="url(#batteryGrad)"
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'all 1s' }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nivel</span>
            <span className="text-5xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {Math.round(percentage)}
            </span>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
