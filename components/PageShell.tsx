import type { ReactNode } from 'react';

import { Sidebar } from '@/components/Sidebar';

export function PageShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-svh" style={{ backgroundColor: 'var(--app-bg)' }}>
      <Sidebar />

      <main className="pt-16 px-4 pb-6 sm:pt-0 sm:ml-20 sm:p-6">
        <div
          className="flex items-center justify-between rounded-xl border px-4 py-3 mb-4 sm:px-5 sm:mb-6"
          style={{
            backgroundColor: 'var(--header-bg)',
            borderColor: 'var(--border)',
            boxShadow: 'var(--header-shadow)',
          }}
        >
          <h1 className="text-lg sm:text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h1>
        </div>

        {children}
      </main>
    </div>
  );
}
