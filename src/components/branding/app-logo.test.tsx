import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { AppLogo } from '@/components/branding/app-logo';
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

function renderWithProvider(ui: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('AppLogo', () => {
  it('falls back to the default logo and name while there is no custom branding', async () => {
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

    const { container } = renderWithProvider(<AppLogo />);

    expect(await screen.findByText('Gateway Hub LF')).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('src', '/favicon.svg');
  });

  it('uses the configured applicationName and logo once branding loads', async () => {
    server.use(
      http.get(`${BASE}/branding`, () =>
        HttpResponse.json(
          successBody({
            applicationName: 'Partner Gateway',
            logoUrl: `${BASE}/branding/assets/logo?v=1`,
            faviconUrl: null,
            brandImageUrl: null,
            updatedAt: '2026-08-07T12:00:00.000Z',
          }),
        ),
      ),
    );

    const { container } = renderWithProvider(<AppLogo />);

    expect(await screen.findByText('Partner Gateway')).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      `${BASE}/branding/assets/logo?v=1`,
    );
  });

  it('hides the name text when collapsed, keeping only the logo image', async () => {
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

    const { container } = renderWithProvider(<AppLogo collapsed />);

    await waitFor(() => expect(container.querySelector('img')).toBeInTheDocument());
    expect(screen.queryByText('Gateway Hub LF')).not.toBeInTheDocument();
  });
});
