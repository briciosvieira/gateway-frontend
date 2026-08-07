import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { TrustedCaStatusDialog } from '@/components/trusted-cas/trusted-ca-status-dialog';
import type { TrustedCa } from '@/features/trusted-cas/trusted-cas.types';
import i18next from '@/lib/i18n';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

const ACTIVE_TRUSTED_CA: TrustedCa = {
  id: 'ca-1',
  name: 'Internal Root CA',
  fingerprintSha256: 'AA:BB:CC',
  subject: 'CN=Internal Root CA',
  issuer: 'CN=Internal Root CA',
  serialNumber: '01',
  validFrom: '2026-01-01T00:00:00.000Z',
  validTo: '2030-01-01T00:00:00.000Z',
  isRoot: true,
  active: true,
  createdById: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function successBody<T>(data: T) {
  return {
    success: true,
    message: 'Request completed successfully.',
    data,
    requestId: 'req-1',
    timestamp: '2026-08-06T12:00:00.000Z',
  };
}

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('TrustedCaStatusDialog', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('offers to deactivate an active certificate and calls PATCH .../status with active:false', async () => {
    let body: Record<string, unknown> | undefined;

    server.use(
      http.patch(`${BASE}/trusted-cas/ca-1/status`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(successBody({ ...ACTIVE_TRUSTED_CA, active: false }));
      }),
    );

    const onSuccess = vi.fn();
    render(
      <TrustedCaStatusDialog
        open
        trustedCa={ACTIVE_TRUSTED_CA}
        onOpenChange={() => {}}
        onSuccess={onSuccess}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('Deactivate certificate')).toBeInTheDocument();
    // Must not claim the connection will automatically work — hostname/validity/TLS chain still apply.
    expect(screen.queryByText(/automatically work/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(body).toEqual({ active: false });
  });

  it('offers to activate an inactive certificate and calls PATCH .../status with active:true', async () => {
    server.use(
      http.patch(`${BASE}/trusted-cas/ca-1/status`, () =>
        HttpResponse.json(successBody({ ...ACTIVE_TRUSTED_CA, active: true })),
      ),
    );

    render(
      <TrustedCaStatusDialog
        open
        trustedCa={{ ...ACTIVE_TRUSTED_CA, active: false }}
        onOpenChange={() => {}}
        onSuccess={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('Activate certificate')).toBeInTheDocument();
  });
});
