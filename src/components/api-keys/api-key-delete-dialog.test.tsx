import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { ApiKeyDeleteDialog } from '@/components/api-keys/api-key-delete-dialog';
import type { ApiKey } from '@/features/api-keys/api-keys.types';
import i18next from '@/lib/i18n';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

const API_KEY: ApiKey = {
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

describe('ApiKeyDeleteDialog', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('never shows the key value/prefix/hash — only the name and a warning that it is unrecoverable', () => {
    render(
      <ApiKeyDeleteDialog open apiKey={API_KEY} onOpenChange={() => {}} onSuccess={() => {}} />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText(/Integration Key/)).toBeInTheDocument();
    expect(screen.getByText('Deletion will not display or recover the key.')).toBeInTheDocument();
    expect(screen.queryByText(API_KEY.prefix)).not.toBeInTheDocument();
    expect(screen.queryByText(/secret|hash/i)).not.toBeInTheDocument();
  });

  it('deletes by internal ID only, calling DELETE /api-keys/:id', async () => {
    let requestedUrl = '';
    server.use(
      http.delete(`${BASE}/api-keys/key-1`, ({ request }) => {
        requestedUrl = request.url;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const onSuccess = vi.fn();
    render(
      <ApiKeyDeleteDialog open apiKey={API_KEY} onOpenChange={() => {}} onSuccess={onSuccess} />,
      { wrapper: createWrapper() },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(requestedUrl).toContain('/api-keys/key-1');
    expect(requestedUrl).not.toContain(API_KEY.prefix);
  });
});
