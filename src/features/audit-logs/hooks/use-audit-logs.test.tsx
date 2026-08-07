import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { auditLogKeys } from '@/features/audit-logs/audit-logs.query-keys';
import { useAuditLog, useAuditLogs } from '@/features/audit-logs/hooks/use-audit-logs';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

const sampleAuditLog = {
  id: 'log-1',
  action: 'CREATE',
  entity: 'USER',
  entityId: 'user-1',
  previousValue: null,
  newValue: { name: 'Ada' },
  sourceIp: '127.0.0.1',
  requestId: 'req-1',
  description: 'User was created.',
  createdAt: '2026-08-07T12:00:00.000Z',
  user: {
    id: 'user-1',
    name: 'Administrator',
    username: 'admin',
    role: { code: 'ADMIN', name: 'Administrator' },
  },
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

describe('useAuditLogs', () => {
  it('sends the given filters as real query params to GET /audit-logs', async () => {
    let requestUrl: URL | undefined;

    server.use(
      http.get(`${BASE}/audit-logs`, ({ request }) => {
        requestUrl = new URL(request.url);
        return HttpResponse.json(
          successBody({
            items: [sampleAuditLog],
            pagination: { page: 2, limit: 20, total: 1, totalPages: 1 },
          }),
        );
      }),
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () =>
        useAuditLogs({
          page: 2,
          limit: 20,
          action: 'CREATE',
          entity: 'USER',
          userId: 'user-1',
          entityId: 'user-1',
          requestId: 'req-1',
          startDate: '2026-08-01',
          endDate: '2026-08-07',
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.items).toEqual([sampleAuditLog]);
    expect(requestUrl?.searchParams.get('page')).toBe('2');
    expect(requestUrl?.searchParams.get('action')).toBe('CREATE');
    expect(requestUrl?.searchParams.get('entity')).toBe('USER');
    expect(requestUrl?.searchParams.get('userId')).toBe('user-1');
    expect(requestUrl?.searchParams.get('entityId')).toBe('user-1');
    expect(requestUrl?.searchParams.get('requestId')).toBe('req-1');
    expect(requestUrl?.searchParams.get('startDate')).toBe('2026-08-01');
    expect(requestUrl?.searchParams.get('endDate')).toBe('2026-08-07');
  });

  it('uses the centralized query key for the list', async () => {
    server.use(
      http.get(`${BASE}/audit-logs`, () =>
        HttpResponse.json(
          successBody({
            items: [sampleAuditLog],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
          }),
        ),
      ),
    );

    const { Wrapper, queryClient } = createWrapper();
    renderHook(() => useAuditLogs({ page: 1 }), { wrapper: Wrapper });

    await waitFor(() =>
      expect(queryClient.getQueryData(auditLogKeys.list({ page: 1 }))).toBeDefined(),
    );
  });
});

describe('useAuditLog', () => {
  it('loads a single audit log by id', async () => {
    server.use(
      http.get(`${BASE}/audit-logs/log-1`, () => HttpResponse.json(successBody(sampleAuditLog))),
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAuditLog('log-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.id).toBe('log-1');
  });
});
