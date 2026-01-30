'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function VirtualJoystick({
  label = 'Joystick',
  size = 180,
  surfaceOpacity = 0.78,
  onChange,
  onEnd,
}: {
  label?: string;
  size?: number;
  surfaceOpacity?: number;
  onChange: (value: { x: number; y: number }) => void; // [-1..1]
  onEnd?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  const radius = useMemo(() => size / 2, [size]);
  const knobRadius = useMemo(() => Math.round(size * 0.18), [size]);
  const limit = useMemo(() => radius - knobRadius - 10, [radius, knobRadius]);

  const [knob, setKnob] = useState({ x: 0, y: 0 }); // px offset from center

  const updateFromClientPoint = (clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = clientX - cx;
    const dy = clientY - cy;

    const distance = Math.hypot(dx, dy);
    const scale = distance > limit ? limit / Math.max(1, distance) : 1;

    const px = dx * scale;
    const py = dy * scale;

    setKnob({ x: px, y: py });

    const nx = clamp(px / limit, -1, 1);
    const ny = clamp(py / limit, -1, 1);
    onChange({ x: nx, y: ny });
  };

  const reset = () => {
    setKnob({ x: 0, y: 0 });
    onChange({ x: 0, y: 0 });
    onEnd?.();
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onPointerMove = (e: PointerEvent) => {
      if (pointerIdRef.current !== e.pointerId) return;
      e.preventDefault();
      updateFromClientPoint(e.clientX, e.clientY);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (pointerIdRef.current !== e.pointerId) return;
      e.preventDefault();
      pointerIdRef.current = null;
      reset();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp, { passive: false });
    window.addEventListener('pointercancel', onPointerUp, { passive: false });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, onChange]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={containerRef}
        className="relative select-none"
        style={{
          width: size,
          height: size,
          touchAction: 'none',
          borderRadius: 9999,
          backgroundColor: 'var(--card-bg)',
          border: `1px solid var(--border)`,
          boxShadow: 'var(--card-shadow)',
          opacity: surfaceOpacity,
        }}
        aria-label={label}
        onPointerDown={(e) => {
          e.preventDefault();
          pointerIdRef.current = e.pointerId;
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
          updateFromClientPoint(e.clientX, e.clientY);
        }}
      >
        {/* Ring */}
        <div
          className="absolute inset-3 rounded-full"
          style={{
            border: `1px solid var(--border)`,
            opacity: 0.8,
          }}
        />

        {/* Center dot */}
        <div
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: 8,
            height: 8,
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'var(--border)',
          }}
        />

        {/* Knob */}
        <div
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: knobRadius * 2,
            height: knobRadius * 2,
            transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))`,
            backgroundColor: 'var(--header-bg)',
            border: `1px solid var(--border)`,
            boxShadow: '0 10px 18px rgba(0,0,0,0.18)',
          }}
        />
      </div>

      <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </div>
    </div>
  );
}
