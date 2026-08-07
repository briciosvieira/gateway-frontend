import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { ApiKeyStatusDialog } from '@/components/api-keys/api-key-status-dialog';
import type { ApiKey } from '@/features/api-keys/api-keys.types';
import i18next from '@/lib/i18n';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

const activeApiKey: ApiKey = {
  id: 'key-1',
  clientId: 'client-1',
  name: 'Integration Key',
  prefix: 'ghlf_a83f2d1c',
  active: true,
  expiresAt: null,
  lastUsedAt: null,
  revokedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  client: { id: 'client-1', name: 'Acme Corp', code: 'ACME', active: true },
};

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('ApiKeyStatusDialog', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('shows the deactivate copy for an active key', () => {
    render(
      <ApiKeyStatusDialog
        open
        apiKey={activeApiKey}
        onOpenChange={() => {}}
        onSuccess={() => {}}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('Deactivate API Key')).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to deactivate the API Key Integration Key/),
    ).toBeInTheDocument();
  });

  it('calls onSuccess after the status change succeeds', async () => {
    server.use(
      http.patch(`${BASE}/api-keys/key-1/status`, () =>
        HttpResponse.json({
          success: true,
          message: 'ok',
          data: { ...activeApiKey, active: false },
          requestId: 'req-1',
          timestamp: '2026-08-06T12:00:00.000Z',
        }),
      ),
    );

    const onSuccess = vi.fn();
    render(
      <ApiKeyStatusDialog
        open
        apiKey={activeApiKey}
        onOpenChange={() => {}}
        onSuccess={onSuccess}
      />,
      { wrapper: createWrapper() },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });
});
