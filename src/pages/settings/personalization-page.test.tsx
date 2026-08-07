import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import i18next from '@/lib/i18n';
import { PersonalizationPage } from '@/pages/settings/personalization-page';
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

function brandingState(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    applicationName: 'Gateway Hub LF',
    logoUrl: null,
    faviconUrl: null,
    brandImageUrl: null,
    updatedAt: null,
    ...overrides,
  };
}

let hasPermissionMock = () => true;
vi.mock('@/features/auth/use-auth', () => ({
  useAuth: () => ({
    hasPermission: (permission: string) => hasPermissionMock() && Boolean(permission),
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function renderPage() {
  return render(<PersonalizationPage />, { wrapper: createWrapper() });
}

describe('PersonalizationPage', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('loads the current applicationName into the name form', async () => {
    server.use(
      http.get(`${BASE}/branding`, () =>
        HttpResponse.json(successBody(brandingState({ applicationName: 'Partner Gateway' }))),
      ),
    );

    hasPermissionMock = () => true;
    renderPage();

    // The label is present from the very first render (default state) —
    // findByLabelText resolves immediately, before branding loads, so the
    // *value* update needs its own explicit wait.
    await waitFor(() =>
      expect(screen.getByLabelText('Application name')).toHaveValue('Partner Gateway'),
    );
  });

  it('saves the new name and shows a success message', async () => {
    let capturedBody: Record<string, unknown> | undefined;
    server.use(
      http.get(`${BASE}/branding`, () => HttpResponse.json(successBody(brandingState()))),
      http.patch(`${BASE}/branding`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          successBody(brandingState({ applicationName: 'Partner Gateway' })),
        );
      }),
    );

    hasPermissionMock = () => true;
    renderPage();
    await screen.findByLabelText('Application name');

    fireEvent.change(screen.getByLabelText('Application name'), {
      target: { value: 'Partner Gateway' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Changes saved.')).toBeInTheDocument();
    expect(capturedBody?.applicationName).toBe('Partner Gateway');
  });

  it('uploads a logo and shows a success message', async () => {
    server.use(
      http.get(`${BASE}/branding`, () => HttpResponse.json(successBody(brandingState()))),
      http.post(`${BASE}/branding/logo`, () =>
        HttpResponse.json(
          successBody(brandingState({ logoUrl: `${BASE}/branding/assets/logo?v=1` })),
        ),
      ),
    );

    hasPermissionMock = () => true;
    renderPage();
    await screen.findByLabelText('Application name');

    const logoSection = screen.getByText('Application logo').closest('div')!;
    const file = new File(['bytes'], 'logo.png', { type: 'image/png' });
    fireEvent.change(within(logoSection).getByLabelText('Replace'), { target: { files: [file] } });

    expect(await screen.findByText('Logo updated.')).toBeInTheDocument();
  });

  it('removes a customized favicon and shows a success message', async () => {
    server.use(
      http.get(`${BASE}/branding`, () =>
        HttpResponse.json(
          successBody(brandingState({ faviconUrl: `${BASE}/branding/assets/favicon?v=1` })),
        ),
      ),
      http.delete(`${BASE}/branding/favicon`, () =>
        HttpResponse.json(successBody(brandingState({ faviconUrl: null }))),
      ),
    );

    hasPermissionMock = () => true;
    renderPage();
    await screen.findByLabelText('Application name');

    const faviconSection = screen.getByText('Favicon').closest('div')!;
    // The section starts out showing the default (not-yet-loaded) state —
    // the "Reset to default" button only appears once branding loads and
    // `isCustomFavicon` becomes true.
    fireEvent.click(
      await within(faviconSection).findByRole('button', { name: 'Reset to default' }),
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }));

    expect(await screen.findByText('Favicon removed.')).toBeInTheDocument();
  });

  it('hides every write control for a non-ADMIN user (branding.update denied)', async () => {
    server.use(http.get(`${BASE}/branding`, () => HttpResponse.json(successBody(brandingState()))));

    hasPermissionMock = () => false;
    renderPage();
    await screen.findByLabelText('Application name');

    expect(screen.getByLabelText('Application name')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Replace')).not.toBeInTheDocument();
  });
});
