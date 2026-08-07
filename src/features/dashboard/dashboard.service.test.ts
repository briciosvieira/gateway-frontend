import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as dashboardService from '@/features/dashboard/dashboard.service';
import { apiClient } from '@/lib/api/api-client';

vi.mock('@/lib/api/api-client', () => ({
  apiClient: { get: vi.fn() },
}));

function envelope<T>(data: T) {
  return {
    data: {
      success: true,
      message: 'Request completed successfully.',
      data,
      requestId: 'req-123',
      timestamp: '2026-08-06T12:00:00.000Z',
    },
  };
}

describe('dashboard.service', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
  });

  it('getOverview calls /dashboard/overview and unwraps the envelope', async () => {
    const overview = {
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
    };
    vi.mocked(apiClient.get).mockResolvedValue(envelope(overview));

    const result = await dashboardService.getOverview({ period: 'last7days' });

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/overview', {
      params: { period: 'last7days' },
      signal: undefined,
    });
    expect(result).toEqual(overview);
  });

  it('getRequestsOverTime calls /dashboard/requests-over-time', async () => {
    const points = [{ label: '2026-08-01', requests: 10, success: 9, error: 1 }];
    vi.mocked(apiClient.get).mockResolvedValue(envelope(points));

    const result = await dashboardService.getRequestsOverTime();

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/requests-over-time', {
      params: undefined,
      signal: undefined,
    });
    expect(result).toEqual(points);
  });

  it('getStatusDistribution calls /dashboard/status-distribution', async () => {
    const items = [{ statusCode: 200, total: 90 }];
    vi.mocked(apiClient.get).mockResolvedValue(envelope(items));

    const result = await dashboardService.getStatusDistribution();

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/status-distribution', {
      params: undefined,
      signal: undefined,
    });
    expect(result).toEqual(items);
  });

  it('getTopClients calls /dashboard/top-clients with the limit param', async () => {
    const items = [
      {
        clientId: 'c1',
        name: 'Acme',
        code: 'ACME',
        requests: 50,
        errors: 1,
        averageResponseTime: 100,
      },
    ];
    vi.mocked(apiClient.get).mockResolvedValue(envelope(items));

    const result = await dashboardService.getTopClients({ limit: 5 });

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/top-clients', {
      params: { limit: 5 },
      signal: undefined,
    });
    expect(result).toEqual(items);
  });

  it('getTopRoutes calls /dashboard/top-routes with the limit param', async () => {
    const items = [
      {
        routeId: 'r1',
        name: 'Orders',
        slug: 'orders',
        method: 'GET',
        requests: 40,
        errors: 2,
        averageResponseTime: 80,
      },
    ];
    vi.mocked(apiClient.get).mockResolvedValue(envelope(items));

    const result = await dashboardService.getTopRoutes({ limit: 5 });

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/top-routes', {
      params: { limit: 5 },
      signal: undefined,
    });
    expect(result).toEqual(items);
  });

  it('searchClients calls /clients with search and limit params', async () => {
    const items = [{ id: 'c1', name: 'Acme', code: 'ACME' }];
    vi.mocked(apiClient.get).mockResolvedValue(
      envelope({ items, pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } }),
    );

    const result = await dashboardService.searchClients({ search: 'acm' });

    expect(apiClient.get).toHaveBeenCalledWith('/clients', {
      params: { search: 'acm', limit: 10 },
      signal: undefined,
    });
    expect(result).toEqual(items);
  });

  it('searchGatewayRoutes calls /gateway-routes with search and limit params', async () => {
    const items = [{ id: 'r1', name: 'Orders', slug: 'orders' }];
    vi.mocked(apiClient.get).mockResolvedValue(
      envelope({ items, pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } }),
    );

    const result = await dashboardService.searchGatewayRoutes({ search: 'ord', limit: 5 });

    expect(apiClient.get).toHaveBeenCalledWith('/gateway-routes', {
      params: { search: 'ord', limit: 5 },
      signal: undefined,
    });
    expect(result).toEqual(items);
  });

  it('getRecentRequests calls /dashboard/recent-requests', async () => {
    const items = [
      {
        requestId: 'req-1',
        client: { id: 'c1', name: 'Acme', code: 'ACME' },
        route: { id: 'r1', name: 'Orders', slug: 'orders' },
        statusCode: 200,
        durationMs: 120,
        createdAt: '2026-08-06T12:00:00.000Z',
      },
    ];
    vi.mocked(apiClient.get).mockResolvedValue(envelope(items));

    const result = await dashboardService.getRecentRequests();

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/recent-requests', {
      params: undefined,
      signal: undefined,
    });
    expect(result).toEqual(items);
  });
});
