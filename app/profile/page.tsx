import { PageShell } from '@/components/PageShell';
import { ProfilePasswordForm } from '@/components/ProfilePasswordForm';

export default function ProfilePage() {
  return (
    <PageShell title="Perfil">
      <div className="space-y-6">
        <ProfilePasswordForm />
      </div>
    </PageShell>
  );
}
