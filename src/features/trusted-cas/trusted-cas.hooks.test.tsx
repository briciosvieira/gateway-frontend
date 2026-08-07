import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import {
  trustedCaKeys,
  useChangeTrustedCaStatus,
  useCreateTrustedCa,
  useDeleteTrustedCa,
  useTrustedCas,
} from '@/features/trusted-cas/trusted-cas.hooks';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

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

describe('useTrustedCas', () => {
  it('sends the given filters as real query params to GET /trusted-cas', async () => {
    let requestUrl: URL | undefined;

    server.use(
      http.get(`${BASE}/trusted-cas`, ({ request }) => {
        requestUrl = new URL(request.url);
        return HttpResponse.json(
          successBody({
            items: [sampleTrustedCa],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
            filters: {},
          }),
        );
      }),
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () =>
        useTrustedCas({
          page: 1,
          limit: 20,
          search: 'root',
          active: true,
          validity: 'valid',
          sortBy: 'name',
          sortOrder: 'asc',
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.items).toEqual([sampleTrustedCa]);
    expect(requestUrl?.searchParams.get('search')).toBe('root');
    expect(requestUrl?.searchParams.get('active')).toBe('true');
    expect(requestUrl?.searchParams.get('validity')).toBe('valid');
    expect(requestUrl?.searchParams.get('sortBy')).toBe('name');
    expect(requestUrl?.searchParams.get('sortOrder')).toBe('asc');
  });
});

describe('useCreateTrustedCa', () => {
  it('invalidates the trusted CAs list query on success', async () => {
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
      http.post(`${BASE}/trusted-cas`, () => HttpResponse.json(successBody(sampleTrustedCa))),
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result: listResult } = renderHook(() => useTrustedCas({}), { wrapper: Wrapper });
    await waitFor(() => expect(listResult.current.isLoading).toBe(false));

    const { result: createResult } = renderHook(() => useCreateTrustedCa(), { wrapper: Wrapper });
    const file = new File(['cert-bytes'], 'root-ca.pem');
    await createResult.current.mutateAsync({ name: 'Internal Root CA', file });

    await waitFor(() =>
      expect(queryClient.getQueryState(trustedCaKeys.list({}))?.isInvalidated).toBe(true),
    );
  });
});

describe('useChangeTrustedCaStatus', () => {
  it('invalidates the list and the detail cache on success', async () => {
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
      http.patch(`${BASE}/trusted-cas/ca-1/status`, () =>
        HttpResponse.json(successBody({ ...sampleTrustedCa, active: false })),
      ),
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result: listResult } = renderHook(() => useTrustedCas({}), { wrapper: Wrapper });
    await waitFor(() => expect(listResult.current.isLoading).toBe(false));

    const { result: statusResult } = renderHook(() => useChangeTrustedCaStatus('ca-1'), {
      wrapper: Wrapper,
    });
    await statusResult.current.mutateAsync({ active: false });

    await waitFor(() =>
      expect(queryClient.getQueryState(trustedCaKeys.list({}))?.isInvalidated).toBe(true),
    );
  });
});

describe('useDeleteTrustedCa', () => {
  it('invalidates the list and removes the detail cache on success', async () => {
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
      http.delete(`${BASE}/trusted-cas/ca-1`, () => new HttpResponse(null, { status: 204 })),
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result: listResult } = renderHook(() => useTrustedCas({}), { wrapper: Wrapper });
    await waitFor(() => expect(listResult.current.isLoading).toBe(false));

    queryClient.setQueryData(trustedCaKeys.detail('ca-1'), sampleTrustedCa);

    const { result: deleteResult } = renderHook(() => useDeleteTrustedCa('ca-1'), {
      wrapper: Wrapper,
    });
    await deleteResult.current.mutateAsync();

    await waitFor(() =>
      expect(queryClient.getQueryState(trustedCaKeys.list({}))?.isInvalidated).toBe(true),
    );
    expect(queryClient.getQueryData(trustedCaKeys.detail('ca-1'))).toBeUndefined();
  });
});
