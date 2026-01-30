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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--app-bg)' }}>
      <Sidebar />

      <main className="ml-20 p-6" style={{ marginLeft: 80, padding: 24 }}>
        <div
          className="flex items-center justify-between rounded-xl border px-5 py-3 mb-6"
          style={{
            backgroundColor: 'var(--header-bg)',
            borderColor: 'var(--border)',
            boxShadow: 'var(--header-shadow)',
          }}
        >
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h1>
        </div>

        {children}
      </main>
    </div>
  );
}
