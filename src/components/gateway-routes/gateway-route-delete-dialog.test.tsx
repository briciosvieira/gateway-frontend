import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { GatewayRouteDeleteDialog } from '@/components/gateway-routes/gateway-route-delete-dialog';
import type { GatewayRoute } from '@/features/gateway-routes/gateway-routes.types';
import i18next from '@/lib/i18n';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

const ROUTE: GatewayRoute = {
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
  requiresApiKey: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  client: { id: 'client-1', name: 'Acme Corp', code: 'ACME', active: true },
  publicPath: '/gateway/send-whatsapp',
};

function errorEnvelope(statusCode: number, message: string) {
  return {
    success: false,
    statusCode,
    message,
    error: 'Error',
    path: '/api/v1/gateway-routes/route-1',
    method: 'DELETE',
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

describe('GatewayRouteDeleteDialog', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('shows the dependency warning', () => {
    render(
      <GatewayRouteDeleteDialog open route={ROUTE} onOpenChange={() => {}} onSuccess={() => {}} />,
      { wrapper: createWrapper() },
    );

    expect(
      screen.getByText(
        'This route cannot be deleted while it still has headers or historical records linked to it.',
      ),
    ).toBeInTheDocument();
  });

  it('does not call the API when cancel is clicked', () => {
    let called = false;
    server.use(
      http.delete(`${BASE}/gateway-routes/route-1`, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const onOpenChange = vi.fn();
    render(
      <GatewayRouteDeleteDialog
        open
        route={ROUTE}
        onOpenChange={onOpenChange}
        onSuccess={() => {}}
      />,
      { wrapper: createWrapper() },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(called).toBe(false);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls DELETE /gateway-routes/:id and onSuccess when confirmed', async () => {
    let called = false;
    server.use(
      http.delete(`${BASE}/gateway-routes/route-1`, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const onSuccess = vi.fn();
    render(
      <GatewayRouteDeleteDialog open route={ROUTE} onOpenChange={() => {}} onSuccess={onSuccess} />,
      { wrapper: createWrapper() },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(called).toBe(true);
  });

  it('blocks a second click while the deletion is in flight', async () => {
    let callCount = 0;
    server.use(
      http.delete(`${BASE}/gateway-routes/route-1`, async () => {
        callCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 30));
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const onSuccess = vi.fn();
    render(
      <GatewayRouteDeleteDialog open route={ROUTE} onOpenChange={() => {}} onSuccess={onSuccess} />,
      { wrapper: createWrapper() },
    );

    const button = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(button);
    fireEvent.click(button);

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(callCount).toBe(1);
  });

  it('shows the backend-provided conflict message on 409 (Route Headers still exist)', async () => {
    server.use(
      http.delete(`${BASE}/gateway-routes/route-1`, () =>
        HttpResponse.json(
          errorEnvelope(
            409,
            'Gateway route cannot be deleted while it still has Route Headers. Remove those first.',
          ),
          { status: 409 },
        ),
      ),
    );

    render(
      <GatewayRouteDeleteDialog open route={ROUTE} onOpenChange={() => {}} onSuccess={() => {}} />,
      { wrapper: createWrapper() },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Gateway route cannot be deleted while it still has Route Headers. Remove those first.',
    );
  });
});
