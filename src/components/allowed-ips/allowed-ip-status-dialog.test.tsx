import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { AllowedIpStatusDialog } from '@/components/allowed-ips/allowed-ip-status-dialog';
import type { AllowedIp } from '@/features/allowed-ips/allowed-ips.types';
import i18next from '@/lib/i18n';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

const activeAllowedIp: AllowedIp = {
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

describe('AllowedIpStatusDialog', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('shows the deactivate copy for an active allowed IP', () => {
    render(
      <AllowedIpStatusDialog
        open
        allowedIp={activeAllowedIp}
        onOpenChange={() => {}}
        onSuccess={() => {}}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('Deactivate Allowed IP')).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to deactivate the Allowed IP 192.168.1.0\/24/),
    ).toBeInTheDocument();
  });

  it('calls onSuccess after the status change succeeds', async () => {
    server.use(
      http.patch(`${BASE}/allowed-ips/ip-1/status`, () =>
        HttpResponse.json({
          success: true,
          message: 'ok',
          data: { ...activeAllowedIp, active: false },
          requestId: 'req-1',
          timestamp: '2026-08-06T12:00:00.000Z',
        }),
      ),
    );

    const onSuccess = vi.fn();
    render(
      <AllowedIpStatusDialog
        open
        allowedIp={activeAllowedIp}
        onOpenChange={() => {}}
        onSuccess={onSuccess}
      />,
      { wrapper: createWrapper() },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it('activate/deactivate keeps working for a HOSTNAME allowed IP, same as IP/CIDR', async () => {
    const hostnameAllowedIp: AllowedIp = { ...activeAllowedIp, type: 'HOSTNAME', address: 'api.cliente.com.br' };
    server.use(
      http.patch(`${BASE}/allowed-ips/ip-1/status`, () =>
        HttpResponse.json({
          success: true,
          message: 'ok',
          data: { ...hostnameAllowedIp, active: false },
          requestId: 'req-1',
          timestamp: '2026-08-06T12:00:00.000Z',
        }),
      ),
    );

    const onSuccess = vi.fn();
    render(
      <AllowedIpStatusDialog
        open
        allowedIp={hostnameAllowedIp}
        onOpenChange={() => {}}
        onSuccess={onSuccess}
      />,
      { wrapper: createWrapper() },
    );

    expect(
      screen.getByText(/Are you sure you want to deactivate the Allowed IP api\.cliente\.com\.br/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });
});
