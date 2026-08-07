import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { BrandingEffects } from '@/components/branding/branding-effects';
import { AuthProvider } from '@/contexts/auth-context';
import { SidebarProvider } from '@/contexts/sidebar-context';
import { ThemeProvider } from '@/contexts/theme-context';
import { queryClient } from '@/lib/api/api-query-client';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <QueryClientProvider client={queryClient}>
          {/* Outside AuthProvider on purpose — document title/favicon must
              update regardless of authentication state (e.g. on /login). */}
          <BrandingEffects />
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}
