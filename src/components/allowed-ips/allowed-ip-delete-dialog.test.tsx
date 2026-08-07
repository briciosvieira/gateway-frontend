import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { AllowedIpDeleteDialog } from '@/components/allowed-ips/allowed-ip-delete-dialog';
import type { AllowedIp } from '@/features/allowed-ips/allowed-ips.types';
import i18next from '@/lib/i18n';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

const ALLOWED_IP: AllowedIp = {
  id: 'ip-1',
  clientId: 'client-1',
  address: '192.168.1.0/24',
  type: 'CIDR_IPV4',
  description: null,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  client: { id: 'client-1', name: 'Acme Corp', code: 'ACME', active: true },
};

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('AllowedIpDeleteDialog', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('shows the client, address/CIDR and type in the confirmation copy', () => {
    render(
      <AllowedIpDeleteDialog
        open
        allowedIp={ALLOWED_IP}
        onOpenChange={() => {}}
        onSuccess={() => {}}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
    expect(screen.getByText(/192\.168\.1\.0\/24/)).toBeInTheDocument();
    expect(screen.getByText(/CIDR IPv4/)).toBeInTheDocument();
  });

  it('calls DELETE /allowed-ips/:id and onSuccess when confirmed', async () => {
    let called = false;
    server.use(
      http.delete(`${BASE}/allowed-ips/ip-1`, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const onSuccess = vi.fn();
    render(
      <AllowedIpDeleteDialog
        open
        allowedIp={ALLOWED_IP}
        onOpenChange={() => {}}
        onSuccess={onSuccess}
      />,
      { wrapper: createWrapper() },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(called).toBe(true);
  });
});
