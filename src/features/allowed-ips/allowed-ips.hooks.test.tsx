import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import {
  allowedIpKeys,
  useAllowedIps,
  useCreateAllowedIp,
} from '@/features/allowed-ips/allowed-ips.hooks';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

const sampleAllowedIp = {
  id: 'ip-1',
  clientId: 'client-1',
  address: '192.168.1.0/24',
  type: 'CIDR_IPV4',
  description: null,
  active: true,
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

describe('useAllowedIps', () => {
  it('sends the given filters as real query params to GET /allowed-ips', async () => {
    let requestUrl: URL | undefined;

    server.use(
      http.get(`${BASE}/allowed-ips`, ({ request }) => {
        requestUrl = new URL(request.url);
        return HttpResponse.json(
          successBody({
            items: [sampleAllowedIp],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
            filters: {},
          }),
        );
      }),
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useAllowedIps({ page: 1, limit: 20, search: '192.168', active: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.items).toEqual([sampleAllowedIp]);
    expect(requestUrl?.searchParams.get('search')).toBe('192.168');
    expect(requestUrl?.searchParams.get('active')).toBe('true');
  });
});

describe('useCreateAllowedIp', () => {
  it('invalidates the allowed-ips list query on success', async () => {
    server.use(
      http.get(`${BASE}/allowed-ips`, () =>
        HttpResponse.json(
          successBody({
            items: [sampleAllowedIp],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
            filters: {},
          }),
        ),
      ),
      http.post(`${BASE}/allowed-ips`, () => HttpResponse.json(successBody(sampleAllowedIp))),
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result: listResult } = renderHook(() => useAllowedIps({}), { wrapper: Wrapper });
    await waitFor(() => expect(listResult.current.isLoading).toBe(false));

    const { result: createResult } = renderHook(() => useCreateAllowedIp(), { wrapper: Wrapper });
    await createResult.current.mutateAsync({ address: '192.168.1.50/24', clientId: 'client-1' });

    await waitFor(() =>
      expect(queryClient.getQueryState(allowedIpKeys.list({}))?.isInvalidated).toBe(true),
    );
  });
});
