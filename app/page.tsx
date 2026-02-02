import Link from 'next/link';
import { PageShell } from '@/components/PageShell';

export default function Home() {
  return (
    <PageShell title="Panel IOT-ROBOT">
      <div className="max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/dashboard"
            className="p-4 sm:p-6 border transition-transform"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Dashboard
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Telemetría y estado del robot
            </p>
          </Link>

          <Link
            href="/drive"
            className="p-4 sm:p-6 border transition-transform"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Control
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Maneja el robot en tiempo real
            </p>
          </Link>

          <Link
            href="/admin"
            className="p-4 sm:p-6 border transition-transform"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Admin
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Gestión de robots y usuarios
            </p>
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
