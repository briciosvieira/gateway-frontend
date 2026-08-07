import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as routeHeadersService from '@/features/route-headers/route-headers.service';
import { apiClient } from '@/lib/api/api-client';

vi.mock('@/lib/api/api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
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

describe('route-headers.service', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
    vi.mocked(apiClient.patch).mockReset();
    vi.mocked(apiClient.delete).mockReset();
  });

  it('findRouteHeaders calls GET /route-headers with the given query params', async () => {
    const paginated = {
      items: [sampleRouteHeader],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      filters: {},
    };
    vi.mocked(apiClient.get).mockResolvedValue(envelope(paginated));

    const params = { page: 1, limit: 20, search: 'api', active: true };
    const result = await routeHeadersService.findRouteHeaders(params);

    expect(apiClient.get).toHaveBeenCalledWith('/route-headers', { params, signal: undefined });
    expect(result).toEqual(paginated);
  });

  it('findRouteHeaderById calls GET /route-headers/:id', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(envelope(sampleRouteHeader));

    const result = await routeHeadersService.findRouteHeaderById('header-1');

    expect(apiClient.get).toHaveBeenCalledWith('/route-headers/header-1', {
      signal: undefined,
    });
    expect(result).toEqual(sampleRouteHeader);
  });

  it('createRouteHeader calls POST /route-headers', async () => {
    vi.mocked(apiClient.post).mockResolvedValue(envelope(sampleRouteHeader));

    const payload = {
      gatewayRouteId: 'route-1',
      name: 'X-Api-Key',
      value: '123456',
      sensitive: true,
    };
    const result = await routeHeadersService.createRouteHeader(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/route-headers', payload);
    expect(result).toEqual(sampleRouteHeader);
  });

  it('updateRouteHeader calls PATCH /route-headers/:id with only the given fields', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(envelope(sampleRouteHeader));

    const result = await routeHeadersService.updateRouteHeader('header-1', {
      name: 'X-Api-Token',
    });

    expect(apiClient.patch).toHaveBeenCalledWith('/route-headers/header-1', {
      name: 'X-Api-Token',
    });
    expect(result).toEqual(sampleRouteHeader);
  });

  it('changeRouteHeaderStatus calls PATCH /route-headers/:id/status', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(envelope({ ...sampleRouteHeader, active: false }));

    const result = await routeHeadersService.changeRouteHeaderStatus('header-1', {
      active: false,
    });

    expect(apiClient.patch).toHaveBeenCalledWith('/route-headers/header-1/status', {
      active: false,
    });
    expect(result.active).toBe(false);
  });

  it('deleteRouteHeader calls DELETE /route-headers/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ status: 204 });

    await routeHeadersService.deleteRouteHeader('header-1');

    expect(apiClient.delete).toHaveBeenCalledWith('/route-headers/header-1');
  });
});
