import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { TrustedCaDeleteDialog } from '@/components/trusted-cas/trusted-ca-delete-dialog';
import type { TrustedCa } from '@/features/trusted-cas/trusted-cas.types';
import i18next from '@/lib/i18n';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

const TRUSTED_CA: TrustedCa = {
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

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('TrustedCaDeleteDialog', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('shows the dependency warning copy, never a PEM/raw certificate value, and calls DELETE on confirm', async () => {
    let called = false;

    server.use(
      http.delete(`${BASE}/trusted-cas/ca-1`, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const onSuccess = vi.fn();
    render(
      <TrustedCaDeleteDialog
        open
        trustedCa={TRUSTED_CA}
        onOpenChange={() => {}}
        onSuccess={onSuccess}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('Delete internal certificate?')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The Gateway will stop trusting services that depend exclusively on this CA.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/BEGIN CERTIFICATE/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(called).toBe(true);
  });

  it('ignores a second confirm click while the first delete is still in flight', async () => {
    let callCount = 0;

    server.use(
      http.delete(`${BASE}/trusted-cas/ca-1`, async () => {
        callCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 50));
        return new HttpResponse(null, { status: 204 });
      }),
    );

    render(
      <TrustedCaDeleteDialog
        open
        trustedCa={TRUSTED_CA}
        onOpenChange={() => {}}
        onSuccess={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButton);
    fireEvent.click(deleteButton);

    await vi.waitFor(() => expect(callCount).toBe(1));
  });
});
