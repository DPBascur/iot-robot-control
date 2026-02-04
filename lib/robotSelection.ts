'use client';

import { useEffect, useMemo, useState } from 'react';

import { config } from '@/lib/config';

const STORAGE_KEY = 'iot-robot:selectedRobotId';
const EVENT_NAME = 'iot-robot:selectedRobotIdChanged';

export function getAvailableRobotIds(): string[] {
  return config.robotIds;
}

export function isValidRobotId(robotId: string): boolean {
  const id = (robotId || '').trim();
  if (!id) return false;
  // Validación sintáctica (no depende de la fuente: env o DB)
  return /^[a-zA-Z0-9._-]{3,64}$/.test(id);
}

export function getSelectedRobotId(): string {
  if (typeof window === 'undefined') return config.robotIds[0] || config.robotId;

  const stored = (window.localStorage.getItem(STORAGE_KEY) || '').trim();
  if (stored && isValidRobotId(stored)) return stored;

  const fallback = config.robotIds[0] || config.robotId;
  window.localStorage.setItem(STORAGE_KEY, fallback);
  return fallback;
}

export function setSelectedRobotId(robotId: string) {
  const next = (robotId || '').trim();
  if (!next || !isValidRobotId(next)) return;
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(STORAGE_KEY, next);
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function useSelectedRobotId() {
  const [robotId, setRobotId] = useState(() => getSelectedRobotId());
  const [availableRobotIds, setAvailableRobotIds] = useState<string[]>(() => getAvailableRobotIds());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      setRobotId(getSelectedRobotId());
    };

    const onCustom = () => setRobotId(getSelectedRobotId());

    window.addEventListener('storage', onStorage);
    window.addEventListener(EVENT_NAME, onCustom);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(EVENT_NAME, onCustom);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/robots', { cache: 'no-store', credentials: 'include' });
        const data = (await res.json().catch(() => null)) as null | {
          robots?: Array<{ robotId?: string }>;
        };
        if (!res.ok) return;

        const ids = (data?.robots || [])
          .map((r) => (r?.robotId || '').trim())
          .filter(Boolean);

        const next = ids.length ? ids : getAvailableRobotIds();
        if (cancelled) return;

        setAvailableRobotIds(next);

        // Si el seleccionado ya no existe, cambia al primero disponible
        const current = getSelectedRobotId();
        if (!next.includes(current)) {
          setSelectedRobotId(next[0]!);
          setRobotId(next[0]!);
        }
      } catch {
        // noop: fallback a env
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const ids = useMemo(() => availableRobotIds, [availableRobotIds]);

  return {
    robotId,
    availableRobotIds: ids,
    setRobotId: (id: string) => setSelectedRobotId(id),
  };
}
