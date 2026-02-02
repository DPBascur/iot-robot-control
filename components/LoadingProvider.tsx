'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';

import { RobotLoader } from '@/components/RobotLoader';

type LoadingApi = {
  show: (label?: string) => void;
  hide: () => void;
  isLoading: boolean;
};

const LoadingContext = createContext<LoadingApi | null>(null);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [label, setLabel] = useState<string>('Cargando…');

  const api = useMemo<LoadingApi>(
    () => ({
      isLoading,
      show: (l?: string) => {
        setLabel(l ?? 'Cargando…');
        setIsLoading(true);
      },
      hide: () => setIsLoading(false),
    }),
    [isLoading]
  );

  return (
    <LoadingContext.Provider value={api}>
      {children}
      {isLoading && <RobotLoader label={label} fullscreen />}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLoading() debe usarse dentro de <LoadingProvider>.');
  return ctx;
}
