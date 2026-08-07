import type { ReactNode } from 'react';

import { AppLogo } from '@/components/branding/app-logo';
import { MobileSidebar } from '@/components/layout/mobile-sidebar';
import { Sidebar } from '@/components/layout/sidebar';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 md:hidden">
          <AppLogo />
          <MobileSidebar />
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  );
}
