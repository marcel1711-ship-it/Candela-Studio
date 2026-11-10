import type { Metadata } from 'next';

import { AdminShell } from '@/components/admin/shell';
import { requireAdmin } from '@/lib/auth';

export const metadata: Metadata = {
  title: { default: 'Panel', template: '%s · Panel' },
  robots: { index: false, follow: false },
};

// El panel siempre refleja el estado actual: nada de cachés en una vista de
// inventario y pedidos.
export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireAdmin();

  return (
    <AdminShell
      store={ctx.store}
      stores={ctx.stores}
      email={ctx.email}
      fullName={ctx.fullName}
      isPlatformAdmin={ctx.isPlatformAdmin}
    >
      {children}
    </AdminShell>
  );
}
