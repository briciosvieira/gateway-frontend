import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { ClientDeleteDialog } from '@/components/clients/client-delete-dialog';
import type { Client } from '@/features/clients/clients.types';
import i18next from '@/lib/i18n';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

const CLIENT: Client = {
  id: 'client-1',
  name: 'Acme Corp',
  code: 'acme-corp',
  description: null,
  contactName: null,
  contactEmail: null,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('ClientDeleteDialog', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('shows the dependency warning', () => {
    render(
      <ClientDeleteDialog open client={CLIENT} onOpenChange={() => {}} onSuccess={() => {}} />,
      { wrapper: createWrapper() },
    );

    expect(
      screen.getByText(
        'Deletion may be blocked if the client has linked API Keys, Allowed IPs, Gateway Routes or log history.',
      ),
    ).toBeInTheDocument();
  });

  it('calls DELETE /clients/:id and onSuccess when confirmed', async () => {
    let called = false;
    server.use(
      http.delete(`${BASE}/clients/client-1`, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const onSuccess = vi.fn();
    render(
      <ClientDeleteDialog open client={CLIENT} onOpenChange={() => {}} onSuccess={onSuccess} />,
      { wrapper: createWrapper() },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(called).toBe(true);
  });

  it('shows the backend-provided conflict message on 409 (dependencies exist)', async () => {
    server.use(
      http.delete(`${BASE}/clients/client-1`, () =>
        HttpResponse.json(
          {
            success: false,
            statusCode: 409,
            code: 'CLIENT_HAS_DEPENDENCIES',
            message: 'This client still has API Keys, Allowed IPs or Gateway Routes linked to it.',
            error: 'Conflict',
            path: '/api/v1/clients/client-1',
            method: 'DELETE',
            requestId: 'req-9',
            timestamp: '2026-08-06T12:00:00.000Z',
          },
          { status: 409 },
        ),
      ),
    );

    render(
      <ClientDeleteDialog open client={CLIENT} onOpenChange={() => {}} onSuccess={() => {}} />,
      { wrapper: createWrapper() },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'This client still has API Keys, Allowed IPs or Gateway Routes linked to it.',
    );
    expect(alert).toHaveTextContent('Reference code: req-9');
  });
});
