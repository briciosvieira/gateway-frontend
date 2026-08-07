import { Outlet } from 'react-router-dom';

import { AppShell } from '@/components/layout/app-shell';

export function AdminLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
