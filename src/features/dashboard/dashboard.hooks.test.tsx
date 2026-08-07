import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { useDashboard, useDashboardCards } from '@/features/dashboard/dashboard.hooks';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useDashboardCards', () => {
  it('derives the six card view models from the overview response', async () => {
    server.use(
      http.get(`${BASE}/dashboard/overview`, () =>
        HttpResponse.json({
          success: true,
          message: 'ok',
          data: {
            totalClients: 3,
            activeClients: 3,
            totalApiKeys: 5,
            activeApiKeys: 4,
            totalRoutes: 8,
            activeRoutes: 8,
            totalRequests: 1000,
            requestsInPeriod: 200,
            successfulRequests: 190,
            failedRequests: 10,
            successRate: 95,
            errorRate: 5,
            averageResponseTime: 120,
            maxResponseTime: 800,
            averageAttempts: 1.1,
          },
          requestId: 'req-1',
          timestamp: '2026-08-06T12:00:00.000Z',
        }),
      ),
    );

    const { result } = renderHook(() => useDashboardCards(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.cards).toEqual([
      { key: 'clients', value: 3 },
      { key: 'apiKeys', value: 5 },
      { key: 'routes', value: 8 },
      { key: 'requests', value: 200 },
      { key: 'errors', value: 10 },
      { key: 'successRate', value: 95, unit: 'percent' },
    ]);
  });

  it('returns undefined cards while the query is loading', () => {
    server.use(
      http.get(`${BASE}/dashboard/overview`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json({
          success: true,
          message: 'ok',
          data: {},
          requestId: 'req-1',
          timestamp: '',
        });
      }),
    );

    const { result } = renderHook(() => useDashboardCards(), { wrapper: createWrapper() });

    expect(result.current.cards).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
  });
});

describe('useDashboard with filters', () => {
  it('forwards the period filter as a query param to /dashboard/overview', async () => {
    let capturedUrl: URL | undefined;

    server.use(
      http.get(`${BASE}/dashboard/overview`, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json({
          success: true,
          message: 'ok',
          data: {},
          requestId: 'req-1',
          timestamp: '2026-08-06T12:00:00.000Z',
        });
      }),
    );

    const { result } = renderHook(() => useDashboard({ period: 'last30days' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(capturedUrl?.searchParams.get('period')).toBe('last30days');
  });
});
