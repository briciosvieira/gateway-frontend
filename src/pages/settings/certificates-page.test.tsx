import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import i18next from '@/lib/i18n';
import { CertificatesPage } from '@/pages/settings/certificates-page';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

vi.mock('@/features/auth/use-auth', () => ({
  useAuth: () => ({ hasPermission: () => true }),
}));

function successBody<T>(data: T) {
  return {
    success: true,
    message: 'Request completed successfully.',
    data,
    requestId: 'req-1',
    timestamp: '2026-08-06T12:00:00.000Z',
  };
}

const sampleTrustedCa = {
  id: 'ca-1',
  name: 'Internal Root CA',
  fingerprintSha256: 'AA:BB:CC',
  subject: 'CN=Internal Root CA',
  issuer: 'CN=Internal Root CA',
  serialNumber: '01',
  validFrom: '2026-01-01T00:00:00.000Z',
  validTo: '2030-01-01T00:00:00.000Z',
  isRoot: true,
  active: true,
  createdById: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CertificatesPage />
    </QueryClientProvider>,
  );
}

describe('CertificatesPage', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('shows the empty state with a call to action when there are no certificates', async () => {
    server.use(
      http.get(`${BASE}/trusted-cas`, () =>
        HttpResponse.json(
          successBody({
            items: [],
            pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
            filters: {},
          }),
        ),
      ),
    );

    renderPage();

    expect(await screen.findByText('No internal certificates registered.')).toBeInTheDocument();
    expect(
      screen.getByText("The Gateway will use only the system's default certificate authorities."),
    ).toBeInTheDocument();
  });

  it('shows the error state with a retry action when the list request fails', async () => {
    server.use(
      http.get(`${BASE}/trusted-cas`, () =>
        HttpResponse.json(
          {
            success: false,
            statusCode: 500,
            message: 'Internal error',
            error: 'Internal Server Error',
            path: '/api/v1/trusted-cas',
            method: 'GET',
            requestId: 'req-err',
            timestamp: '2026-08-06T12:00:00.000Z',
          },
          { status: 500 },
        ),
      ),
    );

    renderPage();

    // The query retries 5xx responses (up to twice, with backoff) before surfacing
    // the error state — the default findBy timeout isn't long enough for that.
    expect(
      await screen.findByRole('button', { name: 'Try again' }, { timeout: 5000 }),
    ).toBeInTheDocument();
  });

  it('lists real metadata and opens the create dialog from the "+ Adicionar certificado" action', async () => {
    server.use(
      http.get(`${BASE}/trusted-cas`, () =>
        HttpResponse.json(
          successBody({
            items: [sampleTrustedCa],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
            filters: {},
          }),
        ),
      ),
    );

    renderPage();

    expect(await screen.findByText('Internal Root CA')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add certificate' }));
    expect(await screen.findByText('Add internal certificate')).toBeInTheDocument();
  });

  it('never renders a TLS-bypass option or any certificate download/raw-view/copy-PEM/export/edit action', async () => {
    server.use(
      http.get(`${BASE}/trusted-cas`, () =>
        HttpResponse.json(
          successBody({
            items: [sampleTrustedCa],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
            filters: {},
          }),
        ),
      ),
    );

    renderPage();
    await screen.findByText('Internal Root CA');

    for (const forbidden of [
      /ignore ssl/i,
      /ignore tls/i,
      /accept invalid certificate/i,
      /disable validation/i,
      /download/i,
      /view certificate/i,
      /export certificate/i,
      /copy pem/i,
    ]) {
      expect(screen.queryByText(forbidden)).not.toBeInTheDocument();
    }
  });
});
