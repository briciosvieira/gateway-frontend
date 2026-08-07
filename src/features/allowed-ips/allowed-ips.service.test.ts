import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as allowedIpsService from '@/features/allowed-ips/allowed-ips.service';
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

const sampleAllowedIp = {
  id: 'ip-1',
  clientId: 'client-1',
  address: '192.168.1.0/24',
  type: 'CIDR_IPV4' as const,
  description: null,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  client: { id: 'client-1', name: 'Acme Corp', code: 'ACME', active: true },
};

describe('allowed-ips.service', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
    vi.mocked(apiClient.patch).mockReset();
    vi.mocked(apiClient.delete).mockReset();
  });

  it('findAllowedIps calls GET /allowed-ips with the given query params', async () => {
    const paginated = {
      items: [sampleAllowedIp],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      filters: {},
    };
    vi.mocked(apiClient.get).mockResolvedValue(envelope(paginated));

    const params = { page: 1, limit: 20, search: '192.168', active: true };
    const result = await allowedIpsService.findAllowedIps(params);

    expect(apiClient.get).toHaveBeenCalledWith('/allowed-ips', { params, signal: undefined });
    expect(result).toEqual(paginated);
  });

  it('findAllowedIpById calls GET /allowed-ips/:id', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(envelope(sampleAllowedIp));

    const result = await allowedIpsService.findAllowedIpById('ip-1');

    expect(apiClient.get).toHaveBeenCalledWith('/allowed-ips/ip-1', { signal: undefined });
    expect(result).toEqual(sampleAllowedIp);
  });

  it('createAllowedIp calls POST /allowed-ips and returns the normalized address', async () => {
    vi.mocked(apiClient.post).mockResolvedValue(envelope(sampleAllowedIp));

    const payload = { address: '192.168.1.50/24', clientId: 'client-1' };
    const result = await allowedIpsService.createAllowedIp(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/allowed-ips', payload);
    expect(result.address).toBe('192.168.1.0/24');
  });

  it('updateAllowedIp calls PATCH /allowed-ips/:id with only the given fields', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(envelope(sampleAllowedIp));

    const result = await allowedIpsService.updateAllowedIp('ip-1', {
      description: 'Office network',
    });

    expect(apiClient.patch).toHaveBeenCalledWith('/allowed-ips/ip-1', {
      description: 'Office network',
    });
    expect(result).toEqual(sampleAllowedIp);
  });

  it('changeAllowedIpStatus calls PATCH /allowed-ips/:id/status', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(envelope({ ...sampleAllowedIp, active: false }));

    const result = await allowedIpsService.changeAllowedIpStatus('ip-1', { active: false });

    expect(apiClient.patch).toHaveBeenCalledWith('/allowed-ips/ip-1/status', { active: false });
    expect(result.active).toBe(false);
  });

  it('deleteAllowedIp calls DELETE /allowed-ips/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ status: 204 });

    await allowedIpsService.deleteAllowedIp('ip-1');

    expect(apiClient.delete).toHaveBeenCalledWith('/allowed-ips/ip-1');
  });
});
