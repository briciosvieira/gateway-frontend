import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { EditRouteHeaderForm } from '@/components/route-headers/route-header-form';
import type { RouteHeader } from '@/features/route-headers/route-headers.types';
import i18next from '@/lib/i18n';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

const ROUTE_HEADER: RouteHeader = {
  id: 'header-1',
  gatewayRouteId: 'route-1',
  name: 'X-Api-Key',
  value: '********',
  sensitive: true,
  active: true,
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

describe('EditRouteHeaderForm', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('keeps the sensitive value input empty on edit and omits value from PATCH when left blank', async () => {
    let body: Record<string, unknown> | undefined;

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
      http.patch(`${BASE}/route-headers/header-1`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          successBody({
            ...ROUTE_HEADER,
            name: 'X-Api-Token',
          }),
        );
      }),
    );

    render(
      <EditRouteHeaderForm
        open
        routeHeader={ROUTE_HEADER}
        onOpenChange={() => {}}
        onSuccess={() => {}}
      />,
      { wrapper: createWrapper() },
    );

    const valueInput = screen.getByLabelText('Value') as HTMLInputElement;
    expect(valueInput.value).toBe('');

    fireEvent.change(screen.getByLabelText('Header name'), {
      target: { value: 'X-Api-Token' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await screen.findByText('Send WhatsApp');
    await screen.findByText('Acme Corp');
    await vi.waitFor(() => expect(body).toEqual({ name: 'X-Api-Token' }));
    expect(body).toEqual({ name: 'X-Api-Token' });
  });
});
