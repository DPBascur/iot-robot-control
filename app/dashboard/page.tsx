import { PageShell } from '@/components/PageShell';
import { RobotDashboard } from '@/components/RobotDashboard';

export default function DashboardPage() {
  return (
    <PageShell title="Tu Dashboard">
      <RobotDashboard />
    </PageShell>
  );
}
