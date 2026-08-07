import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { apiKeyKeys, useApiKeys, useCreateApiKey } from '@/features/api-keys/api-keys.hooks';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

const sampleApiKey = {
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

function successBody<T>(data: T) {
  return {
    success: true,
    message: 'Request completed successfully.',
    data,
    requestId: 'req-1',
    timestamp: '2026-08-06T12:00:00.000Z',
  };
}

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return {
    Wrapper: function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    },
    queryClient,
  };
}

describe('useApiKeys', () => {
  it('sends the given filters as real query params to GET /api-keys', async () => {
    let requestUrl: URL | undefined;

    server.use(
      http.get(`${BASE}/api-keys`, ({ request }) => {
        requestUrl = new URL(request.url);
        return HttpResponse.json(
          successBody({
            items: [sampleApiKey],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
            filters: {},
          }),
        );
      }),
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useApiKeys({ page: 1, limit: 20, search: 'integration', active: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.items).toEqual([sampleApiKey]);
    expect(requestUrl?.searchParams.get('search')).toBe('integration');
    expect(requestUrl?.searchParams.get('active')).toBe('true');
  });
});

describe('useCreateApiKey', () => {
  it('invalidates the api-keys list query on success', async () => {
    server.use(
      http.get(`${BASE}/api-keys`, () =>
        HttpResponse.json(
          successBody({
            items: [sampleApiKey],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
            filters: {},
          }),
        ),
      ),
      http.post(`${BASE}/api-keys`, () =>
        HttpResponse.json(
          successBody({
            apiKey: sampleApiKey,
            key: 'ghlf_a83f2d1c_secretvalue',
            warning: 'Store this API Key securely. It will not be displayed again.',
          }),
        ),
      ),
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result: listResult } = renderHook(() => useApiKeys({}), { wrapper: Wrapper });
    await waitFor(() => expect(listResult.current.isLoading).toBe(false));

    const { result: createResult } = renderHook(() => useCreateApiKey(), { wrapper: Wrapper });
    await createResult.current.mutateAsync({ name: 'Integration Key', clientId: 'client-1' });

    await waitFor(() =>
      expect(queryClient.getQueryState(apiKeyKeys.list({}))?.isInvalidated).toBe(true),
    );
  });
});
