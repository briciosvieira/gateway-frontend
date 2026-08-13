import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { AllowedIpClientDrawer } from '@/components/allowed-ips/allowed-ip-client-drawer';
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

const SAMPLE_IP = {
  id: 'ip-1',
  clientId: 'client-1',
  address: '192.168.1.0/24',
  type: 'CIDR_IPV4',
  description: null,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  client: { id: 'client-1', name: 'duda N8N', code: 'duda-n8n', active: true },
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

function ipsBody(items: (typeof SAMPLE_IP)[]) {
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

describe('AllowedIpClientDrawer', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('queries GET /allowed-ips?clientId=<id>, without the client filter combobox', async () => {
    let capturedUrl: URL | undefined;
    server.use(
      http.get(`${BASE}/allowed-ips`, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json(ipsBody([SAMPLE_IP]));
      }),
    );

    render(<AllowedIpClientDrawer open client={CLIENT} onOpenChange={() => {}} />, {
      wrapper: createWrapper(),
    });

    expect(await screen.findByText('192.168.1.0/24')).toBeInTheDocument();
    expect(capturedUrl?.searchParams.get('clientId')).toBe('client-1');
    expect(screen.queryByLabelText('Client')).not.toBeInTheDocument();
  });

  it('"+ New Allowed IP" creates with the client already locked — no client picker, no GET /clients call', async () => {
    let clientsRequested = false;
    let capturedFormBody: Record<string, unknown> | undefined;
    server.use(
      http.get(`${BASE}/allowed-ips`, () => HttpResponse.json(ipsBody([]))),
      http.get(`${BASE}/clients`, () => {
        clientsRequested = true;
        return HttpResponse.json(successBody({ items: [], pagination: {} }));
      }),
      http.post(`${BASE}/allowed-ips`, async ({ request }) => {
        capturedFormBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(successBody(SAMPLE_IP));
      }),
    );

    render(<AllowedIpClientDrawer open client={CLIENT} onOpenChange={() => {}} />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(await screen.findByRole('button', { name: 'New Allowed IP' }));
    expect(await screen.findByText('duda N8N (duda-n8n)')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Client' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('IP address'), {
      target: { value: '192.168.1.0/24' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Allowed IP' }));

    await screen.findByText('Allowed IP created successfully: 192.168.1.0/24.');
    expect(capturedFormBody?.clientId).toBe('client-1');
    expect(clientsRequested).toBe(false);
  });
});
