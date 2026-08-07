import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { RouteHeaderDeleteDialog } from '@/components/route-headers/route-header-delete-dialog';
import type { RouteHeader } from '@/features/route-headers/route-headers.types';
import i18next from '@/lib/i18n';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

const ROUTE_HEADER: RouteHeader = {
  id: 'header-1',
  gatewayRouteId: 'route-1',
  name: 'X-Api-Key',
  value: 'top-secret-value',
  sensitive: true,
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

function successBody<T>(data: T) {
  return {
    success: true,
    message: 'Request completed successfully.',
    data,
    requestId: 'req-1',
    timestamp: '2026-08-06T12:00:00.000Z',
  };
}

describe('RouteHeaderDeleteDialog', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('never shows the header value and calls DELETE /route-headers/:id when confirmed', async () => {
    let called = false;

    server.use(
      http.get(`${BASE}/gateway-routes/route-1`, () =>
        HttpResponse.json(
          successBody({
            id: 'route-1',
            clientId: 'client-1',
            name: 'Send WhatsApp',
            slug: '/send-whatsapp',
            description: null,
            destinationUrl: 'https://internal.example.com/api/whatsapp',
            method: 'POST',
            timeoutMs: 30000,
            retryCount: 0,
            active: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            client: { id: 'client-1', name: 'Acme Corp', code: 'ACME', active: true },
            publicPath: '/gateway/send-whatsapp',
          }),
        ),
      ),
      http.delete(`${BASE}/route-headers/header-1`, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const onSuccess = vi.fn();
    render(
      <RouteHeaderDeleteDialog
        open
        routeHeader={ROUTE_HEADER}
        onOpenChange={() => {}}
        onSuccess={onSuccess}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.queryByText('top-secret-value')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(called).toBe(true);
    expect(screen.queryByText('top-secret-value')).not.toBeInTheDocument();
  });
});
