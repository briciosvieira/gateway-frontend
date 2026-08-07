import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { ApiKeyClientSummaryItem } from '@/features/api-keys/api-keys.types';
import i18next from '@/lib/i18n';
import { ApiKeysPage } from '@/pages/api-keys/api-keys-page';
import { server } from '@/test/msw/server';

vi.mock('@/features/auth/use-auth', () => ({
  useAuth: () => ({ hasPermission: () => true }),
}));

const BASE = 'http://localhost:3110/api/v1';

async function openRowMenu() {
  const trigger = screen.getByRole('button', { name: 'Actions' });
  fireEvent.pointerDown(trigger, { button: 0, pointerType: 'mouse' });
  fireEvent.pointerUp(trigger, { button: 0, pointerType: 'mouse' });
  fireEvent.click(trigger);
  return screen.findByRole('menu');
}

function successBody<T>(data: T) {
  return {
    success: true,
    message: 'Request completed successfully.',
    data,
    requestId: 'req-1',
    timestamp: '2026-08-07T12:00:00.000Z',
  };
}

function buildSummaryItem(overrides: Partial<ApiKeyClientSummaryItem>): ApiKeyClientSummaryItem {
  return {
    client: { id: 'client-default', name: 'Client default', code: 'client-default', active: true },
    total: 1,
    active: 1,
    inactive: 0,
    revoked: 0,
    ...overrides,
  };
}

function summaryBody(items: ApiKeyClientSummaryItem[], total = items.length) {
  return successBody({
    items,
    pagination: { page: 1, limit: 20, total, totalPages: Math.max(1, Math.ceil(total / 20)) },
  });
}

function apiKeysListBody(items: unknown[], total = items.length) {
  return successBody({
    items,
    pagination: { page: 1, limit: 20, total, totalPages: Math.max(1, Math.ceil(total / 20)) },
  });
}

const CLIENT_1 = buildSummaryItem({
  client: { id: 'client-1', name: 'duda N8N', code: 'duda-n8n', active: true },
  total: 5,
  active: 3,
  inactive: 1,
  revoked: 1,
});

const CLIENT_2 = buildSummaryItem({
  client: { id: 'client-2', name: 'Parceiro Logístico', code: 'parceiro-logistico', active: true },
  total: 2,
  active: 2,
  inactive: 0,
});

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function renderPage() {
  return render(<ApiKeysPage />, { wrapper: createWrapper() });
}

describe('ApiKeysPage', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('lists clients from GET /api-keys/clients-summary and never fetches the unscoped list', async () => {
    let apiKeysRequestCount = 0;
    server.use(
      http.get(`${BASE}/api-keys/clients-summary`, () =>
        HttpResponse.json(summaryBody([CLIENT_1, CLIENT_2])),
      ),
      http.get(`${BASE}/api-keys`, () => {
        apiKeysRequestCount += 1;
        return HttpResponse.json(apiKeysListBody([]));
      }),
    );

    renderPage();

    expect(await screen.findByText('duda N8N')).toBeInTheDocument();
    expect(screen.getByText('duda-n8n')).toBeInTheDocument();
    expect(screen.getByText('Parceiro Logístico')).toBeInTheDocument();
    expect(apiKeysRequestCount).toBe(0);
  });

  it('only shows clients returned by clients-summary — a client with zero API Keys never appears (backend already excludes it)', async () => {
    server.use(
      http.get(`${BASE}/api-keys/clients-summary`, () =>
        HttpResponse.json(summaryBody([CLIENT_1])),
      ),
    );

    renderPage();

    expect(await screen.findByText('duda N8N')).toBeInTheDocument();
    expect(screen.queryByText('Cliente Sem Chaves')).not.toBeInTheDocument();
  });

  it('derives the main STATUS column from active/total, never from client.active', async () => {
    const clientActiveEntityButNoActiveKeys = buildSummaryItem({
      client: {
        id: 'client-3',
        name: 'Cliente Inativo Por Chaves',
        code: 'cliente-3',
        active: true,
      },
      total: 2,
      active: 0,
      inactive: 2,
    });
    const clientInactiveEntityButHasActiveKey = buildSummaryItem({
      client: {
        id: 'client-4',
        name: 'Cliente Ativo Por Chaves',
        code: 'cliente-4',
        active: false,
      },
      total: 1,
      active: 1,
      inactive: 0,
    });
    server.use(
      http.get(`${BASE}/api-keys/clients-summary`, () =>
        HttpResponse.json(
          summaryBody([clientActiveEntityButNoActiveKeys, clientInactiveEntityButHasActiveKey]),
        ),
      ),
    );

    renderPage();

    await screen.findByText('Cliente Inativo Por Chaves');
    const table = screen.getByRole('table');
    // client.active=true, active=0 -> Inactive (never reads client.active).
    // client.active=false, active=1 -> Active.
    expect(within(table).getAllByText('Active')).toHaveLength(1);
    expect(within(table).getAllByText('Inactive')).toHaveLength(1);
  });

  it('shows the aggregate counters (total/active/inactive/revoked) per client', async () => {
    server.use(
      http.get(`${BASE}/api-keys/clients-summary`, () =>
        HttpResponse.json(summaryBody([CLIENT_1])),
      ),
    );

    renderPage();

    expect(
      await screen.findByText('5 total · 3 active · 1 inactive · 1 revoked'),
    ).toBeInTheDocument();
  });

  it('opens the client drawer and queries GET /api-keys?clientId=<id>, paginated, only for that client', async () => {
    let capturedUrl: URL | undefined;
    server.use(
      http.get(`${BASE}/api-keys/clients-summary`, () =>
        HttpResponse.json(summaryBody([CLIENT_1, CLIENT_2])),
      ),
      http.get(`${BASE}/api-keys`, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json(apiKeysListBody([]));
      }),
    );

    renderPage();
    fireEvent.click(await screen.findByText('duda N8N'));

    expect(await screen.findByRole('heading', { name: 'API Keys — duda N8N' })).toBeInTheDocument();
    expect(capturedUrl?.searchParams.get('clientId')).toBe('client-1');
    expect(capturedUrl?.searchParams.get('page')).toBe('1');
    expect(capturedUrl?.searchParams.get('limit')).toBe('20');
  });

  it('creating the first API Key for a client from inside the drawer makes the client appear on the main list', async () => {
    let summaryCallCount = 0;
    const summaryItems: ApiKeyClientSummaryItem[] = [CLIENT_1];
    server.use(
      http.get(`${BASE}/api-keys/clients-summary`, () => {
        summaryCallCount += 1;
        return HttpResponse.json(summaryBody(summaryItems));
      }),
      http.get(`${BASE}/api-keys`, () => HttpResponse.json(apiKeysListBody([]))),
      http.post(`${BASE}/api-keys`, () =>
        HttpResponse.json(
          successBody({
            apiKey: {
              id: 'key-new',
              clientId: 'client-1',
              name: 'Nova chave',
              prefix: 'gwhub_new1',
              active: true,
              expiresAt: null,
              lastUsedAt: null,
              revokedAt: null,
              createdAt: '2026-08-07T12:00:00.000Z',
              updatedAt: '2026-08-07T12:00:00.000Z',
              client: { id: 'client-1', name: 'duda N8N', code: 'duda-n8n', active: true },
            },
            key: 'raw-secret',
            warning: 'warn',
          }),
        ),
      ),
    );

    renderPage();
    fireEvent.click(await screen.findByText('duda N8N'));
    await screen.findByRole('heading', { name: 'API Keys — duda N8N' });

    const initialSummaryCalls = summaryCallCount;

    fireEvent.click(screen.getByRole('button', { name: 'New API Key' }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Nova chave' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create API Key' }));

    await screen.findByText('raw-secret');
    // The mutation must invalidate the clients-summary query too, causing a refetch.
    expect(summaryCallCount).toBeGreaterThan(initialSummaryCalls);
  });

  it('preserves the global "+ New API Key" button, opening the existing create form with client selection', async () => {
    server.use(
      http.get(`${BASE}/api-keys/clients-summary`, () =>
        HttpResponse.json(summaryBody([CLIENT_1, CLIENT_2])),
      ),
    );

    renderPage();
    await screen.findByText('duda N8N');

    fireEvent.click(screen.getByRole('button', { name: 'New API Key' }));
    expect(await screen.findByRole('heading', { name: 'New API Key' })).toBeInTheDocument();
    // The global create form still lets the user pick any client (not locked).
    expect(screen.getByLabelText('Client')).toBeInTheDocument();
  });

  it('sends search/status/sortBy/sortOrder to the summary endpoint', async () => {
    let capturedUrl: URL | undefined;
    server.use(
      http.get(`${BASE}/api-keys/clients-summary`, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json(summaryBody([CLIENT_1]));
      }),
    );

    renderPage();
    await screen.findByText('duda N8N');

    fireEvent.change(screen.getByLabelText('Search by client name or code'), {
      target: { value: 'duda' },
    });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'active' } });
    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'total' } });
    fireEvent.change(screen.getByLabelText('Order'), { target: { value: 'desc' } });

    await vi.waitFor(() => {
      expect(capturedUrl?.searchParams.get('status')).toBe('active');
    });
    expect(capturedUrl?.searchParams.get('sortBy')).toBe('total');
    expect(capturedUrl?.searchParams.get('sortOrder')).toBe('desc');
  });

  it('paginates the summary list server-side (page param sent to clients-summary)', async () => {
    let lastPage: string | null = null;
    server.use(
      http.get(`${BASE}/api-keys/clients-summary`, ({ request }) => {
        lastPage = new URL(request.url).searchParams.get('page');
        return HttpResponse.json(summaryBody([CLIENT_1, CLIENT_2], 40));
      }),
    );

    renderPage();
    await screen.findByText('duda N8N');
    expect(lastPage).toBe('1');

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByText('duda N8N');
    expect(lastPage).toBe('2');
  });

  it("deleting a client's last API Key invalidates the summary so the client would disappear from the main list on refetch", async () => {
    let hasKey = true;
    let summaryCallCount = 0;
    const sampleApiKey = {
      id: 'key-1',
      clientId: 'client-1',
      name: 'Última chave',
      prefix: 'gwhub_ab12',
      active: true,
      expiresAt: null,
      lastUsedAt: null,
      revokedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      client: { id: 'client-1', name: 'duda N8N', code: 'duda-n8n', active: true },
    };
    server.use(
      http.get(`${BASE}/api-keys/clients-summary`, () => {
        summaryCallCount += 1;
        return HttpResponse.json(summaryBody(hasKey ? [CLIENT_1] : []));
      }),
      http.get(`${BASE}/api-keys`, () =>
        HttpResponse.json(apiKeysListBody(hasKey ? [sampleApiKey] : [])),
      ),
      http.delete(`${BASE}/api-keys/key-1`, () => {
        hasKey = false;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderPage();
    fireEvent.click(await screen.findByText('duda N8N'));
    await screen.findByText('Última chave');

    const summaryCallsBeforeDelete = summaryCallCount;

    await openRowMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: /Delete/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    // The drawer's own clientId-scoped list refetches and becomes empty...
    await screen.findByText('No API Keys found for this client.');
    // ...and the mutation also invalidated the main clients-summary query,
    // which is what makes the client disappear from the main list once it
    // refetches (verified here as a refetch — the main list is behind the
    // open drawer and isn't re-asserted visually in this test).
    expect(summaryCallCount).toBeGreaterThan(summaryCallsBeforeDelete);
  });

  it("deactivating a client's last active API Key flips the main STATUS to Inactive (summary invalidation)", async () => {
    let isActive = true;
    const sampleApiKey = {
      id: 'key-1',
      clientId: 'client-1',
      name: 'Chave única',
      prefix: 'gwhub_ab12',
      active: true,
      expiresAt: null,
      lastUsedAt: null,
      revokedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      client: { id: 'client-1', name: 'duda N8N', code: 'duda-n8n', active: true },
    };
    server.use(
      http.get(`${BASE}/api-keys/clients-summary`, () =>
        HttpResponse.json(
          summaryBody([
            buildSummaryItem({
              client: { id: 'client-1', name: 'duda N8N', code: 'duda-n8n', active: true },
              total: 1,
              active: isActive ? 1 : 0,
              inactive: isActive ? 0 : 1,
            }),
          ]),
        ),
      ),
      http.get(`${BASE}/api-keys`, () =>
        HttpResponse.json(apiKeysListBody([{ ...sampleApiKey, active: isActive }])),
      ),
      http.patch(`${BASE}/api-keys/key-1/status`, () => {
        isActive = false;
        return HttpResponse.json(successBody({ ...sampleApiKey, active: false }));
      }),
    );

    renderPage();
    fireEvent.click(await screen.findByText('duda N8N'));
    await screen.findByText('Chave única');

    expect(within(screen.getByRole('table')).getByText('Active')).toBeInTheDocument();

    await openRowMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: /Deactivate/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Close' }));

    await vi.waitFor(() => {
      expect(within(screen.getByRole('table')).getByText('Inactive')).toBeInTheDocument();
    });
  });
});
