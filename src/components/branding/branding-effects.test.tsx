import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { BrandingEffects } from '@/components/branding/branding-effects';
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

function renderEffects() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrandingEffects />
    </QueryClientProvider>,
  );
}

describe('BrandingEffects', () => {
  beforeEach(() => {
    document.title = 'stale title';
    document
      .querySelectorAll('link[rel="icon"]')
      .forEach((link) => link.parentElement?.removeChild(link));
  });

  afterEach(() => {
    document
      .querySelectorAll('link[rel="icon"]')
      .forEach((link) => link.parentElement?.removeChild(link));
  });

  it('sets document.title to the default applicationName while there is no custom branding', async () => {
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

    renderEffects();

    await waitFor(() => expect(document.title).toBe('Gateway Hub LF'));
  });

  it('updates document.title to the configured applicationName once branding loads', async () => {
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

    renderEffects();

    await waitFor(() => expect(document.title).toBe('Partner Gateway'));
  });

  it('creates and updates the <link rel="icon"> favicon href dynamically, without duplicating the tag', async () => {
    server.use(
      http.get(`${BASE}/branding`, () =>
        HttpResponse.json(
          successBody({
            applicationName: 'Gateway Hub LF',
            logoUrl: null,
            faviconUrl: `${BASE}/branding/assets/favicon?v=1`,
            brandImageUrl: null,
            updatedAt: '2026-08-07T12:00:00.000Z',
          }),
        ),
      ),
    );

    renderEffects();

    await waitFor(() => {
      const links = document.querySelectorAll('link[rel="icon"]');
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAttribute('href', `${BASE}/branding/assets/favicon?v=1`);
    });
  });

  it('falls back to the default favicon when no custom one is configured', async () => {
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

    renderEffects();

    await waitFor(() => {
      const links = document.querySelectorAll('link[rel="icon"]');
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAttribute('href', '/favicon.svg');
    });
  });
});
