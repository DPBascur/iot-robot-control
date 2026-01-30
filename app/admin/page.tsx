import { PageShell } from '@/components/PageShell';

export default function AdminPage() {
  return (
    <PageShell title="Administración">
      <div className="space-y-6">
        <section
          className="p-6 border"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Gestión de Robots
          </h2>
          {/* Lista de robots */}
        </section>

        <section
          className="p-6 border"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Gestión de Usuarios
          </h2>
          {/* Lista de usuarios */}
        </section>
      </div>
    </PageShell>
  );
}
