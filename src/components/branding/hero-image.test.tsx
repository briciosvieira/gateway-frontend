import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it } from 'vitest';

import { HeroImage } from '@/components/branding/hero-image';
import i18next from '@/lib/i18n';
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

describe('HeroImage', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('falls back to the default mascot image while there is no custom brand image', async () => {
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

    renderWithProvider(<HeroImage />);

    expect(await screen.findByRole('img')).toHaveAttribute('src', '/duda10.png');
  });

  it('uses the configured brand image once branding loads — the same asset shared by Home and Login', async () => {
    server.use(
      http.get(`${BASE}/branding`, () =>
        HttpResponse.json(
          successBody({
            applicationName: 'Gateway Hub LF',
            logoUrl: null,
            faviconUrl: null,
            brandImageUrl: '/api/v1/branding/assets/brand-image?v=1',
            updatedAt: '2026-08-07T12:00:00.000Z',
          }),
        ),
      ),
    );

    renderWithProvider(<HeroImage />);

    // The <img> is present from the very first render (showing the default
    // fallback) — findByRole resolves as soon as it appears, not once its
    // `src` reaches its final value, so the `src` update itself needs an
    // explicit wait.
    await waitFor(() =>
      expect(screen.getByRole('img')).toHaveAttribute(
        'src',
        `${BASE}/branding/assets/brand-image?v=1`,
      ),
    );
  });
});
