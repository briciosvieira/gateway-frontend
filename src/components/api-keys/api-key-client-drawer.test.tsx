import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { ApiKeyClientDrawer } from '@/components/api-keys/api-key-client-drawer';
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

const SAMPLE_API_KEY = {
  id: 'key-1',
  clientId: 'client-1',
  name: 'teste',
  prefix: 'gwhub_ab12',
  active: true,
  expiresAt: null,
  lastUsedAt: null,
  revokedAt: null,
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

function apiKeysBody(items: (typeof SAMPLE_API_KEY)[], total = items.length) {
  return successBody({
    items,
    pagination: { page: 1, limit: 20, total, totalPages: Math.max(1, Math.ceil(total / 20)) },
  });
}

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('ApiKeyClientDrawer', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('queries GET /api-keys?clientId=<id> for the given client, without the client filter combobox', async () => {
    let capturedUrl: URL | undefined;
    server.use(
      http.get(`${BASE}/api-keys`, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json(apiKeysBody([SAMPLE_API_KEY]));
      }),
    );

    render(<ApiKeyClientDrawer open client={CLIENT} onOpenChange={() => {}} />, {
      wrapper: createWrapper(),
    });

    expect(await screen.findByText('teste')).toBeInTheDocument();
    expect(capturedUrl?.searchParams.get('clientId')).toBe('client-1');
    // The per-feature client combobox filter is hidden — the client is already fixed.
    expect(screen.queryByLabelText('Client')).not.toBeInTheDocument();
  });

  it('shows the empty state scoped to this client when it has no API Keys', async () => {
    server.use(http.get(`${BASE}/api-keys`, () => HttpResponse.json(apiKeysBody([]))));

    render(<ApiKeyClientDrawer open client={CLIENT} onOpenChange={() => {}} />, {
      wrapper: createWrapper(),
    });

    expect(await screen.findByText('No API Keys found for this client.')).toBeInTheDocument();
  });

  it('"+ New API Key" creates with the client already locked — no client picker, no GET /clients call', async () => {
    let clientsRequested = false;
    let capturedFormBody: Record<string, unknown> | undefined;
    server.use(
      http.get(`${BASE}/api-keys`, () => HttpResponse.json(apiKeysBody([]))),
      http.get(`${BASE}/clients`, () => {
        clientsRequested = true;
        return HttpResponse.json(successBody({ items: [], pagination: {} }));
      }),
      http.post(`${BASE}/api-keys`, async ({ request }) => {
        capturedFormBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          successBody({ apiKey: SAMPLE_API_KEY, key: 'raw-secret', warning: 'warn' }),
        );
      }),
    );

    render(<ApiKeyClientDrawer open client={CLIENT} onOpenChange={() => {}} />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(await screen.findByRole('button', { name: 'New API Key' }));
    expect(await screen.findByText('duda N8N (duda-n8n)')).toBeInTheDocument();
    // No interactive client picker inside the create dialog either.
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Integration Key' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create API Key' }));

    await screen.findByText('raw-secret');
    expect(capturedFormBody?.clientId).toBe('client-1');
    expect(clientsRequested).toBe(false);
  });

  it('paginates the client-scoped list server-side', async () => {
    let lastPage: string | null = null;
    server.use(
      http.get(`${BASE}/api-keys`, ({ request }) => {
        lastPage = new URL(request.url).searchParams.get('page');
        return HttpResponse.json(apiKeysBody([SAMPLE_API_KEY], 40));
      }),
    );

    render(<ApiKeyClientDrawer open client={CLIENT} onOpenChange={() => {}} />, {
      wrapper: createWrapper(),
    });

    await screen.findByText('teste');
    expect(lastPage).toBe('1');

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByText('teste');
    expect(lastPage).toBe('2');
  });

  it('switching the client prop re-queries for the new clientId', async () => {
    const capturedClientIds: Array<string | null> = [];
    server.use(
      http.get(`${BASE}/api-keys`, ({ request }) => {
        capturedClientIds.push(new URL(request.url).searchParams.get('clientId'));
        return HttpResponse.json(apiKeysBody([]));
      }),
    );

    const { rerender } = render(
      <ApiKeyClientDrawer open client={CLIENT} onOpenChange={() => {}} />,
      { wrapper: createWrapper() },
    );
    await screen.findByRole('heading', { name: 'API Keys — duda N8N' });

    const otherClient: Client = { ...CLIENT, id: 'client-2', name: 'Other Client' };
    rerender(<ApiKeyClientDrawer open client={otherClient} onOpenChange={() => {}} />);
    await screen.findByRole('heading', { name: 'API Keys — Other Client' });

    expect(capturedClientIds).toEqual(['client-1', 'client-2']);
  });
});
