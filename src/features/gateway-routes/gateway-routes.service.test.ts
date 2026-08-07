import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as gatewayRoutesService from '@/features/gateway-routes/gateway-routes.service';
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

const sampleRoute = {
  id: 'route-1',
  clientId: 'client-1',
  name: 'Send WhatsApp',
  slug: '/send-whatsapp',
  description: null,
  destinationUrl: 'https://internal.example.com/api/whatsapp',
  method: 'POST' as const,
  timeoutMs: 30000,
  retryCount: 0,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  client: { id: 'client-1', name: 'Acme Corp', code: 'ACME', active: true },
  publicPath: '/gateway/send-whatsapp',
};

describe('gateway-routes.service', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
    vi.mocked(apiClient.patch).mockReset();
    vi.mocked(apiClient.delete).mockReset();
  });

  it('findGatewayRoutes calls GET /gateway-routes with the given query params', async () => {
    const paginated = {
      items: [sampleRoute],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      filters: {},
    };
    vi.mocked(apiClient.get).mockResolvedValue(envelope(paginated));

    const params = { page: 1, limit: 20, search: 'whatsapp', active: true };
    const result = await gatewayRoutesService.findGatewayRoutes(params);

    expect(apiClient.get).toHaveBeenCalledWith('/gateway-routes', { params, signal: undefined });
    expect(result).toEqual(paginated);
  });

  it('findGatewayRouteById calls GET /gateway-routes/:id', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(envelope(sampleRoute));

    const result = await gatewayRoutesService.findGatewayRouteById('route-1');

    expect(apiClient.get).toHaveBeenCalledWith('/gateway-routes/route-1', { signal: undefined });
    expect(result).toEqual(sampleRoute);
  });

  it('createGatewayRoute calls POST /gateway-routes', async () => {
    vi.mocked(apiClient.post).mockResolvedValue(envelope(sampleRoute));

    const payload = {
      name: 'Send WhatsApp',
      slug: '/send-whatsapp',
      destinationUrl: 'https://internal.example.com/api/whatsapp',
      method: 'POST' as const,
      clientId: 'client-1',
    };
    const result = await gatewayRoutesService.createGatewayRoute(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/gateway-routes', payload);
    expect(result).toEqual(sampleRoute);
  });

  it('updateGatewayRoute calls PATCH /gateway-routes/:id with only the given fields', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(envelope(sampleRoute));

    const result = await gatewayRoutesService.updateGatewayRoute('route-1', {
      name: 'Send WhatsApp Renamed',
    });

    expect(apiClient.patch).toHaveBeenCalledWith('/gateway-routes/route-1', {
      name: 'Send WhatsApp Renamed',
    });
    expect(result).toEqual(sampleRoute);
  });

  it('changeGatewayRouteStatus calls PATCH /gateway-routes/:id/status', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(envelope({ ...sampleRoute, active: false }));

    const result = await gatewayRoutesService.changeGatewayRouteStatus('route-1', {
      active: false,
    });

    expect(apiClient.patch).toHaveBeenCalledWith('/gateway-routes/route-1/status', {
      active: false,
    });
    expect(result.active).toBe(false);
  });

  it('deleteGatewayRoute calls DELETE /gateway-routes/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ status: 204 });

    await gatewayRoutesService.deleteGatewayRoute('route-1');

    expect(apiClient.delete).toHaveBeenCalledWith('/gateway-routes/route-1');
  });
});
