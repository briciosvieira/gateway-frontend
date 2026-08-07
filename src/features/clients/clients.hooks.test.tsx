import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import {
  clientKeys,
  useClients,
  useCreateClient,
  useDeleteClient,
} from '@/features/clients/clients.hooks';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

const sampleClient = {
  id: 'client-1',
  name: 'Acme Corp',
  code: 'ACME',
  description: null,
  contactName: null,
  contactEmail: null,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
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

describe('useClients', () => {
  it('sends the given filters as real query params to GET /clients', async () => {
    let requestUrl: URL | undefined;

    server.use(
      http.get(`${BASE}/clients`, ({ request }) => {
        requestUrl = new URL(request.url);
        return HttpResponse.json(
          successBody({
            items: [sampleClient],
            pagination: { page: 2, limit: 20, total: 1, totalPages: 1 },
            filters: {},
          }),
        );
      }),
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () =>
        useClients({
          page: 2,
          limit: 20,
          search: 'acme',
          active: true,
          sortBy: 'name',
          sortOrder: 'asc',
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.items).toEqual([sampleClient]);
    expect(requestUrl?.searchParams.get('page')).toBe('2');
    expect(requestUrl?.searchParams.get('search')).toBe('acme');
    expect(requestUrl?.searchParams.get('active')).toBe('true');
    expect(requestUrl?.searchParams.get('sortBy')).toBe('name');
    expect(requestUrl?.searchParams.get('sortOrder')).toBe('asc');
  });
});

describe('useCreateClient', () => {
  it('invalidates the clients list query on success', async () => {
    server.use(
      http.get(`${BASE}/clients`, () =>
        HttpResponse.json(
          successBody({
            items: [sampleClient],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
            filters: {},
          }),
        ),
      ),
      http.post(`${BASE}/clients`, () => HttpResponse.json(successBody(sampleClient))),
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result: listResult } = renderHook(() => useClients({}), { wrapper: Wrapper });
    await waitFor(() => expect(listResult.current.isLoading).toBe(false));

    const { result: createResult } = renderHook(() => useCreateClient(), { wrapper: Wrapper });
    await createResult.current.mutateAsync({ name: 'New Client' });

    await waitFor(() =>
      expect(queryClient.getQueryState(clientKeys.list({}))?.isInvalidated).toBe(true),
    );
  });
});

describe('useDeleteClient', () => {
  it('invalidates the list and removes the detail cache on success', async () => {
    server.use(
      http.get(`${BASE}/clients`, () =>
        HttpResponse.json(
          successBody({
            items: [sampleClient],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
            filters: {},
          }),
        ),
      ),
      http.delete(`${BASE}/clients/client-1`, () => new HttpResponse(null, { status: 204 })),
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result: listResult } = renderHook(() => useClients({}), { wrapper: Wrapper });
    await waitFor(() => expect(listResult.current.isLoading).toBe(false));

    queryClient.setQueryData(clientKeys.detail('client-1'), sampleClient);

    const { result: deleteResult } = renderHook(() => useDeleteClient('client-1'), {
      wrapper: Wrapper,
    });
    await deleteResult.current.mutateAsync();

    await waitFor(() =>
      expect(queryClient.getQueryState(clientKeys.list({}))?.isInvalidated).toBe(true),
    );
    expect(queryClient.getQueryData(clientKeys.detail('client-1'))).toBeUndefined();
  });
});
