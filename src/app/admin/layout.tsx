import { AdminProviders } from '@/components/admin/Providers';
import { AdminAuthGuard } from '@/components/admin/layout/AdminAuthGuard';
import { AdminShell } from '@/components/admin/layout/AdminShell';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProviders>
      <AdminAuthGuard>
        <AdminShell>
          {children}
        </AdminShell>
      </AdminAuthGuard>
    </AdminProviders>
  );
}
