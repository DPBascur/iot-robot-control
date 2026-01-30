import { PageShell } from '@/components/PageShell';
import { AdminConsole } from '@/components/AdminConsole';

export default function AdminPage() {
  return (
    <PageShell title="Administración">
      <AdminConsole />
    </PageShell>
  );
}
