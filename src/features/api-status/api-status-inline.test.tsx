import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it } from 'vitest';

import { ApiStatusInline } from '@/features/api-status/api-status-inline';
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

function renderInline() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return render(<ApiStatusInline />, { wrapper: Wrapper });
}

describe('ApiStatusInline', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('shows the connected state and formatted uptime once the health check resolves', async () => {
    server.use(
      http.get(`${BASE}/health`, () =>
        HttpResponse.json(
          successBody({
            status: 'ok',
            application: 'gateway-hub-lf',
            database: 'ok',
            uptime: 1020,
            timestamp: '2026-08-07T12:00:00.000Z',
          }),
        ),
      ),
    );

    renderInline();

    expect(await screen.findByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Backend status')).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.textContent === 'Uptime 17m')).toBeInTheDocument();
  });

  it('shows the offline state without an uptime value when the health check fails', async () => {
    server.use(http.get(`${BASE}/health`, () => HttpResponse.error()));

    renderInline();

    expect(await screen.findByText('Offline')).toBeInTheDocument();
    expect(screen.queryByText(/Uptime/)).not.toBeInTheDocument();
  });
});
