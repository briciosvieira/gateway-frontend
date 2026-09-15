import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import {
  gatewayRouteKeys,
  useCreateGatewayRoute,
  useDeleteGatewayRoute,
  useGatewayRoutes,
} from '@/features/gateway-routes/gateway-routes.hooks';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

const sampleRoute = {
  id: 'route-1',
  clientId: 'client-1',
  name: 'Send WhatsApp',
  slug: '/send-whatsapp',
  description: null,
  destinationUrl: 'https://internal.example.com/api/whatsapp',
  method: 'POST',
  timeoutMs: 30000,
  retryCount: 0,
  active: true,
  requiresApiKey: true,
  requiresAllowedIp: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  client: { id: 'client-1', name: 'Acme Corp', code: 'ACME', active: true },
  publicPath: '/gateway/send-whatsapp',
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

describe('useGatewayRoutes', () => {
  it('sends the given filters as real query params to GET /gateway-routes', async () => {
    let requestUrl: URL | undefined;

    server.use(
      http.get(`${BASE}/gateway-routes`, ({ request }) => {
        requestUrl = new URL(request.url);
        return HttpResponse.json(
          successBody({
            items: [sampleRoute],
            pagination: { page: 2, limit: 20, total: 1, totalPages: 1 },
            filters: {},
          }),
        );
      }),
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () =>
        useGatewayRoutes({
          page: 2,
          limit: 20,
          search: 'whatsapp',
          active: true,
          sortBy: 'name',
          sortOrder: 'asc',
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.items).toEqual([sampleRoute]);
    expect(requestUrl?.searchParams.get('page')).toBe('2');
    expect(requestUrl?.searchParams.get('search')).toBe('whatsapp');
    expect(requestUrl?.searchParams.get('active')).toBe('true');
    expect(requestUrl?.searchParams.get('sortBy')).toBe('name');
    expect(requestUrl?.searchParams.get('sortOrder')).toBe('asc');
  });
});

describe('useCreateGatewayRoute', () => {
  it('invalidates the gateway routes list query on success', async () => {
    server.use(
      http.get(`${BASE}/gateway-routes`, () =>
        HttpResponse.json(
          successBody({
            items: [sampleRoute],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
            filters: {},
          }),
        ),
      ),
      http.post(`${BASE}/gateway-routes`, () => HttpResponse.json(successBody(sampleRoute))),
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result: listResult } = renderHook(() => useGatewayRoutes({}), { wrapper: Wrapper });
    await waitFor(() => expect(listResult.current.isLoading).toBe(false));

    const { result: createResult } = renderHook(() => useCreateGatewayRoute(), {
      wrapper: Wrapper,
    });
    await createResult.current.mutateAsync({
      name: 'Send WhatsApp',
      slug: '/send-whatsapp',
      destinationUrl: 'https://internal.example.com/api/whatsapp',
      method: 'POST',
      clientId: 'client-1',
    });

    await waitFor(() =>
      expect(queryClient.getQueryState(gatewayRouteKeys.list({}))?.isInvalidated).toBe(true),
    );
  });
});

describe('useDeleteGatewayRoute', () => {
  it('invalidates the list and removes the detail cache on success', async () => {
    server.use(
      http.get(`${BASE}/gateway-routes`, () =>
        HttpResponse.json(
          successBody({
            items: [sampleRoute],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
            filters: {},
          }),
        ),
      ),
      http.delete(`${BASE}/gateway-routes/route-1`, () => new HttpResponse(null, { status: 204 })),
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result: listResult } = renderHook(() => useGatewayRoutes({}), { wrapper: Wrapper });
    await waitFor(() => expect(listResult.current.isLoading).toBe(false));

    queryClient.setQueryData(gatewayRouteKeys.detail('route-1'), sampleRoute);

    const { result: deleteResult } = renderHook(() => useDeleteGatewayRoute('route-1'), {
      wrapper: Wrapper,
    });
    await deleteResult.current.mutateAsync();

    await waitFor(() =>
      expect(queryClient.getQueryState(gatewayRouteKeys.list({}))?.isInvalidated).toBe(true),
    );
    expect(queryClient.getQueryData(gatewayRouteKeys.detail('route-1'))).toBeUndefined();
  });

  it('invalidates the list on a 404 (record already gone)', async () => {
    server.use(
      http.get(`${BASE}/gateway-routes`, () =>
        HttpResponse.json(
          successBody({
            items: [sampleRoute],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
            filters: {},
          }),
        ),
      ),
      http.delete(`${BASE}/gateway-routes/route-1`, () =>
        HttpResponse.json(
          {
            success: false,
            statusCode: 404,
            message: 'Gateway route was not found.',
            error: 'Not Found',
            path: '/api/v1/gateway-routes/route-1',
            method: 'DELETE',
            requestId: 'req-1',
            timestamp: '2026-08-06T12:00:00.000Z',
          },
          { status: 404 },
        ),
      ),
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result: listResult } = renderHook(() => useGatewayRoutes({}), { wrapper: Wrapper });
    await waitFor(() => expect(listResult.current.isLoading).toBe(false));

    const { result: deleteResult } = renderHook(() => useDeleteGatewayRoute('route-1'), {
      wrapper: Wrapper,
    });
    await expect(deleteResult.current.mutateAsync()).rejects.toThrow();

    await waitFor(() =>
      expect(queryClient.getQueryState(gatewayRouteKeys.list({}))?.isInvalidated).toBe(true),
    );
  });
});
