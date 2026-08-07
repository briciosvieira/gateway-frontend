import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import {
  useRequestLog,
  useRequestLogByRequestId,
} from '@/features/request-logs/hooks/use-request-log';
import { useRequestLogs } from '@/features/request-logs/hooks/use-request-logs';
import { requestLogKeys } from '@/features/request-logs/request-logs.query-keys';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

const sampleRequestLog = {
  id: 'log-1',
  requestId: 'req-1',
  attemptedAt: '2026-08-07T12:00:00.000Z',
  requestOrigin: 'PUBLIC',
  sourceHost: 'hub.example.com',
  clientId: 'client-1',
  apiKeyId: 'api-key-1',
  gatewayRouteId: 'route-1',
  sourceIp: '177.1.1.1',
  method: 'POST',
  publicPath: '/gateway/webhook',
  publicEndpoint: 'https://hub.example.com/gateway/webhook',
  destinationHost: 'n8n.internal',
  destinationIp: '10.0.0.1',
  statusCode: 200,
  durationMs: 184,
  attempts: 1,
  result: 'SUCCESS',
  errorCode: null,
  errorMessage: null,
  requestSizeBytes: 120,
  responseSizeBytes: 340,
  createdAt: '2026-08-07T12:00:01.000Z',
  client: { id: 'client-1', name: 'Syngoo', code: 'syngoo' },
  apiKey: { id: 'api-key-1', name: 'Primary key' },
  gatewayRoute: { id: 'route-1', name: 'Webhook', slug: '/webhook', method: 'POST' },
  destinationUrl: 'https://n8n.internal/webhook',
  upstreamStatusCode: 200,
  requestHeaders: { authorization: '********' },
  requestQuery: { foo: 'bar' },
  requestBody: { ok: true },
  responseHeaders: { 'content-type': 'application/json' },
  responseBody: { success: true },
};

function successBody<T>(data: T) {
  return {
    success: true,
    message: 'Request completed successfully.',
    data,
    requestId: 'req-1',
    timestamp: '2026-08-07T12:00:00.000Z',
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

describe('useRequestLogs', () => {
  it('sends the supported backend filters and pagination to GET /request-logs', async () => {
    let requestUrl: URL | undefined;

    server.use(
      http.get(`${BASE}/request-logs`, ({ request }) => {
        requestUrl = new URL(request.url);
        return HttpResponse.json(
          successBody({
            items: [sampleRequestLog],
            pagination: { page: 2, limit: 20, total: 1, totalPages: 1 },
          }),
        );
      }),
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () =>
        useRequestLogs({
          page: 2,
          limit: 20,
          search: 'syngoo',
          clientId: 'client-1',
          apiKeyId: 'api-key-1',
          gatewayRouteId: 'route-1',
          requestOrigin: 'PUBLIC',
          method: 'POST',
          statusCode: 200,
          result: 'SUCCESS',
          startDate: '2026-08-01',
          endDate: '2026-08-07',
          sortBy: 'attemptedAt',
          sortOrder: 'desc',
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.items).toEqual([sampleRequestLog]);
    expect(requestUrl?.searchParams.get('page')).toBe('2');
    expect(requestUrl?.searchParams.get('search')).toBe('syngoo');
    expect(requestUrl?.searchParams.get('clientId')).toBe('client-1');
    expect(requestUrl?.searchParams.get('apiKeyId')).toBe('api-key-1');
    expect(requestUrl?.searchParams.get('gatewayRouteId')).toBe('route-1');
    expect(requestUrl?.searchParams.get('requestOrigin')).toBe('PUBLIC');
    expect(requestUrl?.searchParams.get('method')).toBe('POST');
    expect(requestUrl?.searchParams.get('statusCode')).toBe('200');
    expect(requestUrl?.searchParams.get('result')).toBe('SUCCESS');
    expect(requestUrl?.searchParams.get('startDate')).toBe('2026-08-01');
    expect(requestUrl?.searchParams.get('endDate')).toBe('2026-08-07');
    expect(requestUrl?.searchParams.get('sortBy')).toBe('attemptedAt');
    expect(requestUrl?.searchParams.get('sortOrder')).toBe('desc');
  });

  it('uses the centralized query key for the list cache', async () => {
    server.use(
      http.get(`${BASE}/request-logs`, () =>
        HttpResponse.json(
          successBody({
            items: [sampleRequestLog],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
          }),
        ),
      ),
    );

    const { Wrapper, queryClient } = createWrapper();
    renderHook(() => useRequestLogs({ page: 1 }), { wrapper: Wrapper });

    await waitFor(() =>
      expect(queryClient.getQueryData(requestLogKeys.list({ page: 1 }))).toBeDefined(),
    );
  });
});

describe('useRequestLog', () => {
  it('loads a single request log by id', async () => {
    server.use(
      http.get(`${BASE}/request-logs/log-1`, () =>
        HttpResponse.json(successBody(sampleRequestLog)),
      ),
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useRequestLog('log-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.id).toBe('log-1');
  });

  it('loads a single request log by Request ID', async () => {
    server.use(
      http.get(`${BASE}/request-logs/by-request-id/req-1`, () =>
        HttpResponse.json(successBody(sampleRequestLog)),
      ),
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useRequestLogByRequestId('req-1'), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.requestId).toBe('req-1');
  });
});
