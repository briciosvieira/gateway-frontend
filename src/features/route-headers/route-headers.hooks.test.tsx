import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import {
  routeHeaderKeys,
  useCreateRouteHeader,
  useDeleteRouteHeader,
  useRouteHeaders,
} from '@/features/route-headers/route-headers.hooks';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

const sampleRouteHeader = {
  id: 'header-1',
  gatewayRouteId: 'route-1',
  name: 'X-Api-Key',
  value: '********',
  sensitive: true,
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

describe('useRouteHeaders', () => {
  it('sends the given filters as real query params to GET /route-headers', async () => {
    let requestUrl: URL | undefined;

    server.use(
      http.get(`${BASE}/route-headers`, ({ request }) => {
        requestUrl = new URL(request.url);
        return HttpResponse.json(
          successBody({
            items: [sampleRouteHeader],
            pagination: { page: 2, limit: 20, total: 1, totalPages: 1 },
            filters: {},
          }),
        );
      }),
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () =>
        useRouteHeaders({
          page: 2,
          limit: 20,
          search: 'api',
          gatewayRouteId: 'route-1',
          sensitive: true,
          active: true,
          sortBy: 'headerName',
          sortOrder: 'asc',
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.items).toEqual([sampleRouteHeader]);
    expect(requestUrl?.searchParams.get('page')).toBe('2');
    expect(requestUrl?.searchParams.get('search')).toBe('api');
    expect(requestUrl?.searchParams.get('gatewayRouteId')).toBe('route-1');
    expect(requestUrl?.searchParams.get('sensitive')).toBe('true');
    expect(requestUrl?.searchParams.get('active')).toBe('true');
    expect(requestUrl?.searchParams.get('sortBy')).toBe('headerName');
    expect(requestUrl?.searchParams.get('sortOrder')).toBe('asc');
  });
});

describe('useCreateRouteHeader', () => {
  it('invalidates the route headers list query on success', async () => {
    server.use(
      http.get(`${BASE}/route-headers`, () =>
        HttpResponse.json(
          successBody({
            items: [sampleRouteHeader],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
            filters: {},
          }),
        ),
      ),
      http.post(`${BASE}/route-headers`, () => HttpResponse.json(successBody(sampleRouteHeader))),
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result: listResult } = renderHook(() => useRouteHeaders({}), { wrapper: Wrapper });
    await waitFor(() => expect(listResult.current.isLoading).toBe(false));

    const { result: createResult } = renderHook(() => useCreateRouteHeader(), {
      wrapper: Wrapper,
    });
    await createResult.current.mutateAsync({
      gatewayRouteId: 'route-1',
      name: 'X-Api-Key',
      value: '123456',
      sensitive: true,
    });

    await waitFor(() =>
      expect(queryClient.getQueryState(routeHeaderKeys.list({}))?.isInvalidated).toBe(true),
    );
  });
});

describe('useDeleteRouteHeader', () => {
  it('invalidates the list and removes the detail cache on success', async () => {
    server.use(
      http.get(`${BASE}/route-headers`, () =>
        HttpResponse.json(
          successBody({
            items: [sampleRouteHeader],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
            filters: {},
          }),
        ),
      ),
      http.delete(`${BASE}/route-headers/header-1`, () => new HttpResponse(null, { status: 204 })),
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result: listResult } = renderHook(() => useRouteHeaders({}), { wrapper: Wrapper });
    await waitFor(() => expect(listResult.current.isLoading).toBe(false));

    queryClient.setQueryData(routeHeaderKeys.detail('header-1'), sampleRouteHeader);

    const { result: deleteResult } = renderHook(() => useDeleteRouteHeader('header-1'), {
      wrapper: Wrapper,
    });
    await deleteResult.current.mutateAsync();

    await waitFor(() =>
      expect(queryClient.getQueryState(routeHeaderKeys.list({}))?.isInvalidated).toBe(true),
    );
    expect(queryClient.getQueryData(routeHeaderKeys.detail('header-1'))).toBeUndefined();
  });
});
