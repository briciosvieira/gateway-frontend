import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { GatewayRouteStatusDialog } from '@/components/gateway-routes/gateway-route-status-dialog';
import type { GatewayRoute } from '@/features/gateway-routes/gateway-routes.types';
import i18next from '@/lib/i18n';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

const activeRoute: GatewayRoute = {
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
  requiresAllowedIp: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  client: { id: 'client-1', name: 'Acme Corp', code: 'ACME', active: true },
  publicPath: '/gateway/send-whatsapp',
};

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('GatewayRouteStatusDialog', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('shows the deactivate copy for an active route', () => {
    render(
      <GatewayRouteStatusDialog
        open
        route={activeRoute}
        onOpenChange={() => {}}
        onSuccess={() => {}}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('Deactivate route')).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to deactivate the route Send WhatsApp/),
    ).toBeInTheDocument();
  });

  it('calls onSuccess after the status change succeeds', async () => {
    server.use(
      http.patch(`${BASE}/gateway-routes/route-1/status`, () =>
        HttpResponse.json({
          success: true,
          message: 'ok',
          data: { ...activeRoute, active: false },
          requestId: 'req-1',
          timestamp: '2026-08-06T12:00:00.000Z',
        }),
      ),
    );

    const onSuccess = vi.fn();
    render(
      <GatewayRouteStatusDialog
        open
        route={activeRoute}
        onOpenChange={() => {}}
        onSuccess={onSuccess}
      />,
      { wrapper: createWrapper() },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });
});
