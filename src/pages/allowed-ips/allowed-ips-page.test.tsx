import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { AllowedIpClientSummaryItem } from '@/features/allowed-ips/allowed-ips.types';
import i18next from '@/lib/i18n';
import { AllowedIpsPage } from '@/pages/allowed-ips/allowed-ips-page';
import { server } from '@/test/msw/server';

vi.mock('@/features/auth/use-auth', () => ({
  useAuth: () => ({ hasPermission: () => true }),
}));

const BASE = 'http://localhost:3110/api/v1';

function successBody<T>(data: T) {
  return {
    success: true,
    message: 'Request completed successfully.',
    data,
    requestId: 'req-1',
    timestamp: '2026-08-07T12:00:00.000Z',
  };
}

function buildSummaryItem(
  overrides: Partial<AllowedIpClientSummaryItem>,
): AllowedIpClientSummaryItem {
  return {
    client: { id: 'client-default', name: 'Client default', code: 'client-default', active: true },
    total: 1,
    active: 1,
    inactive: 0,
    ...overrides,
  };
}

function summaryBody(items: AllowedIpClientSummaryItem[], total = items.length) {
  return successBody({
    items,
    pagination: { page: 1, limit: 20, total, totalPages: Math.max(1, Math.ceil(total / 20)) },
  });
}

function listBody(items: unknown[]) {
  return successBody({
    items,
    pagination: { page: 1, limit: 20, total: items.length, totalPages: 1 },
  });
}

const CLIENT_1 = buildSummaryItem({
  client: { id: 'client-1', name: 'duda N8N', code: 'duda-n8n', active: true },
  total: 3,
  active: 2,
  inactive: 1,
});

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function renderPage() {
  return render(<AllowedIpsPage />, { wrapper: createWrapper() });
}

describe('AllowedIpsPage', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('lists clients from GET /allowed-ips/clients-summary and never fetches the unscoped list', async () => {
    let allowedIpsRequestCount = 0;
    server.use(
      http.get(`${BASE}/allowed-ips/clients-summary`, () =>
        HttpResponse.json(summaryBody([CLIENT_1])),
      ),
      http.get(`${BASE}/allowed-ips`, () => {
        allowedIpsRequestCount += 1;
        return HttpResponse.json(listBody([]));
      }),
    );

    renderPage();

    expect(await screen.findByText('duda N8N')).toBeInTheDocument();
    expect(screen.getByText('duda-n8n')).toBeInTheDocument();
    expect(allowedIpsRequestCount).toBe(0);
  });

  it('only shows clients returned by clients-summary — a client with zero Allowed IPs never appears', async () => {
    server.use(
      http.get(`${BASE}/allowed-ips/clients-summary`, () =>
        HttpResponse.json(summaryBody([CLIENT_1])),
      ),
    );

    renderPage();

    expect(await screen.findByText('duda N8N')).toBeInTheDocument();
    expect(screen.queryByText('Cliente Sem IPs')).not.toBeInTheDocument();
  });

  it('derives the main STATUS column from active/total, never from client.active', async () => {
    const inactiveByIps = buildSummaryItem({
      client: { id: 'client-2', name: 'Cliente Inativo Por IPs', code: 'cliente-2', active: true },
      total: 2,
      active: 0,
      inactive: 2,
    });
    server.use(
      http.get(`${BASE}/allowed-ips/clients-summary`, () =>
        HttpResponse.json(summaryBody([inactiveByIps])),
      ),
    );

    renderPage();

    await screen.findByText('Cliente Inativo Por IPs');
    expect(within(screen.getByRole('table')).getByText('Inactive')).toBeInTheDocument();
  });

  it('shows the aggregate counters (total/active/inactive) per client', async () => {
    server.use(
      http.get(`${BASE}/allowed-ips/clients-summary`, () =>
        HttpResponse.json(summaryBody([CLIENT_1])),
      ),
    );

    renderPage();

    expect(await screen.findByText('3 total · 2 active · 1 inactive')).toBeInTheDocument();
  });

  it('opens the client drawer and queries GET /allowed-ips?clientId=<id>, paginated', async () => {
    let capturedUrl: URL | undefined;
    server.use(
      http.get(`${BASE}/allowed-ips/clients-summary`, () =>
        HttpResponse.json(summaryBody([CLIENT_1])),
      ),
      http.get(`${BASE}/allowed-ips`, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json(listBody([]));
      }),
    );

    renderPage();
    fireEvent.click(await screen.findByText('duda N8N'));

    expect(
      await screen.findByRole('heading', { name: 'Allowed IPs — duda N8N' }),
    ).toBeInTheDocument();
    expect(capturedUrl?.searchParams.get('clientId')).toBe('client-1');
    expect(capturedUrl?.searchParams.get('page')).toBe('1');
  });

  it('preserves the global "+ New Allowed IP" button with client selection intact', async () => {
    server.use(
      http.get(`${BASE}/allowed-ips/clients-summary`, () =>
        HttpResponse.json(summaryBody([CLIENT_1])),
      ),
    );

    renderPage();
    await screen.findByText('duda N8N');

    fireEvent.click(screen.getByRole('button', { name: 'New Allowed IP' }));
    expect(await screen.findByRole('heading', { name: 'New Allowed IP' })).toBeInTheDocument();
    expect(screen.getByLabelText('Client')).toBeInTheDocument();
  });

  it('paginates the summary list server-side (page param sent to clients-summary)', async () => {
    let lastPage: string | null = null;
    server.use(
      http.get(`${BASE}/allowed-ips/clients-summary`, ({ request }) => {
        lastPage = new URL(request.url).searchParams.get('page');
        return HttpResponse.json(summaryBody([CLIENT_1], 40));
      }),
    );

    renderPage();
    await screen.findByText('duda N8N');
    expect(lastPage).toBe('1');

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByText('duda N8N');
    expect(lastPage).toBe('2');
  });
});
