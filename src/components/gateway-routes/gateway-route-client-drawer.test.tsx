import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { GatewayRouteClientDrawer } from '@/components/gateway-routes/gateway-route-client-drawer';
import type { Client } from '@/features/clients/clients.types';
import i18next from '@/lib/i18n';
import { server } from '@/test/msw/server';

vi.mock('@/features/auth/use-auth', () => ({
  useAuth: () => ({ hasPermission: () => true }),
}));

const BASE = 'http://localhost:3110/api/v1';

const CLIENT: Client = {
  id: 'client-1',
  name: 'duda N8N',
  code: 'duda-n8n',
  description: null,
  contactName: null,
  contactEmail: null,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const SAMPLE_ROUTE = {
  id: 'route-1',
  clientId: 'client-1',
  name: 'n8n-teste',
  slug: '/n8n-teste',
  description: null,
  destinationUrl: 'https://internal.example.com/n8n',
  method: 'POST',
  timeoutMs: 30000,
  retryCount: 0,
  active: true,
  requiresApiKey: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  client: { id: 'client-1', name: 'duda N8N', code: 'duda-n8n', active: true },
  publicPath: '/gateway/n8n-teste',
};

function successBody<T>(data: T) {
  return {
    success: true,
    message: 'Request completed successfully.',
    data,
    requestId: 'req-1',
    timestamp: '2026-08-07T12:00:00.000Z',
  };
}

function routesBody(items: (typeof SAMPLE_ROUTE)[]) {
  return successBody({
    items,
    pagination: { page: 1, limit: 20, total: items.length, totalPages: 1 },
  });
}

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('GatewayRouteClientDrawer', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('queries GET /gateway-routes?clientId=<id>, without the client filter combobox', async () => {
    let capturedUrl: URL | undefined;
    server.use(
      http.get(`${BASE}/gateway-routes`, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json(routesBody([SAMPLE_ROUTE]));
      }),
    );

    render(<GatewayRouteClientDrawer open client={CLIENT} onOpenChange={() => {}} />, {
      wrapper: createWrapper(),
    });

    expect(await screen.findByText('n8n-teste')).toBeInTheDocument();
    expect(capturedUrl?.searchParams.get('clientId')).toBe('client-1');
    expect(screen.queryByLabelText('Client')).not.toBeInTheDocument();
  });

  it('"+ New route" creates with the client already locked — no client picker, no GET /clients call', async () => {
    let clientsRequested = false;
    let capturedFormBody: Record<string, unknown> | undefined;
    server.use(
      http.get(`${BASE}/gateway-routes`, () => HttpResponse.json(routesBody([]))),
      http.get(`${BASE}/clients`, () => {
        clientsRequested = true;
        return HttpResponse.json(successBody({ items: [], pagination: {} }));
      }),
      http.post(`${BASE}/gateway-routes`, async ({ request }) => {
        capturedFormBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(successBody(SAMPLE_ROUTE));
      }),
    );

    render(<GatewayRouteClientDrawer open client={CLIENT} onOpenChange={() => {}} />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(await screen.findByRole('button', { name: 'New route' }));
    expect(await screen.findByText('duda N8N (duda-n8n)')).toBeInTheDocument();
    // No interactive client picker (the shared `Combobox`) — only the HTTP
    // method `<select>` remains, which is an unrelated native combobox.
    expect(screen.queryByLabelText('Client')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'nova-rota' } });
    fireEvent.change(screen.getByLabelText('Slug'), { target: { value: '/nova-rota' } });
    fireEvent.change(screen.getByLabelText('Destination URL'), {
      target: { value: 'https://internal.example.com/nova-rota' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create route' }));

    // On success the page opens the route's own details drawer, titled with the route's name.
    await screen.findByRole('heading', { name: SAMPLE_ROUTE.name });
    expect(capturedFormBody?.clientId).toBe('client-1');
    expect(clientsRequested).toBe(false);
  });
});
