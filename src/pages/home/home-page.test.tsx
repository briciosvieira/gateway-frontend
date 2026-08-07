import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { beforeAll, describe, expect, it } from 'vitest';

import i18next from '@/lib/i18n';
import { HomePage } from '@/pages/home/home-page';
import { server } from '@/test/msw/server';

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

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <HomePage />
    </QueryClientProvider>,
  );
}

function mockHealth() {
  server.use(
    http.get(`${BASE}/health`, () =>
      HttpResponse.json(
        successBody({
          status: 'ok',
          application: 'gateway-hub-lf',
          database: 'ok',
          uptime: 120,
          timestamp: '2026-08-07T12:00:00.000Z',
        }),
      ),
    ),
  );
}

describe('HomePage', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('shows the default applicationName as the main title while there is no custom branding', async () => {
    mockHealth();
    server.use(
      http.get(`${BASE}/branding`, () =>
        HttpResponse.json(
          successBody({
            applicationName: 'Gateway Hub LF',
            logoUrl: null,
            faviconUrl: null,
            brandImageUrl: null,
            updatedAt: null,
          }),
        ),
      ),
    );

    renderPage();

    expect(await screen.findByRole('heading', { name: 'Gateway Hub LF' })).toBeInTheDocument();
  });

  it('shows the configured applicationName as the main title once branding loads', async () => {
    mockHealth();
    server.use(
      http.get(`${BASE}/branding`, () =>
        HttpResponse.json(
          successBody({
            applicationName: 'Partner Gateway',
            logoUrl: null,
            faviconUrl: null,
            brandImageUrl: null,
            updatedAt: '2026-08-07T12:00:00.000Z',
          }),
        ),
      ),
    );

    renderPage();

    expect(await screen.findByRole('heading', { name: 'Partner Gateway' })).toBeInTheDocument();
  });

  it('never breaks the Home cards even while branding is customized', async () => {
    mockHealth();
    server.use(
      http.get(`${BASE}/branding`, () =>
        HttpResponse.json(
          successBody({
            applicationName: 'Partner Gateway',
            logoUrl: null,
            faviconUrl: null,
            brandImageUrl: null,
            updatedAt: '2026-08-07T12:00:00.000Z',
          }),
        ),
      ),
    );

    renderPage();

    await screen.findByRole('heading', { name: 'Partner Gateway' });
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Routes')).toBeInTheDocument();
  });
});
