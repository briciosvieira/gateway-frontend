import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as clientsService from '@/features/clients/clients.service';
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

const sampleClient = {
  id: 'client-1',
  name: 'Acme Corp',
  code: 'ACME',
  description: null,
  contactName: null,
  contactEmail: null,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('clients.service', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
    vi.mocked(apiClient.patch).mockReset();
    vi.mocked(apiClient.delete).mockReset();
  });

  it('findClients calls GET /clients with the given query params', async () => {
    const paginated = {
      items: [sampleClient],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      filters: {},
    };
    vi.mocked(apiClient.get).mockResolvedValue(envelope(paginated));

    const params = {
      page: 1,
      limit: 20,
      search: 'acme',
      active: true,
      sortBy: 'name' as const,
      sortOrder: 'asc' as const,
    };
    const result = await clientsService.findClients(params);

    expect(apiClient.get).toHaveBeenCalledWith('/clients', { params, signal: undefined });
    expect(result).toEqual(paginated);
  });

  it('findClientById calls GET /clients/:id', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(envelope(sampleClient));

    const result = await clientsService.findClientById('client-1');

    expect(apiClient.get).toHaveBeenCalledWith('/clients/client-1', { signal: undefined });
    expect(result).toEqual(sampleClient);
  });

  it('createClient calls POST /clients', async () => {
    vi.mocked(apiClient.post).mockResolvedValue(envelope(sampleClient));

    const payload = { name: 'Acme Corp' };
    const result = await clientsService.createClient(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/clients', payload);
    expect(result).toEqual(sampleClient);
  });

  it('updateClient calls PATCH /clients/:id with only the given fields', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(envelope(sampleClient));

    const result = await clientsService.updateClient('client-1', { name: 'Acme Corp Renamed' });

    expect(apiClient.patch).toHaveBeenCalledWith('/clients/client-1', {
      name: 'Acme Corp Renamed',
    });
    expect(result).toEqual(sampleClient);
  });

  it('changeClientStatus calls PATCH /clients/:id/status', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(envelope({ ...sampleClient, active: false }));

    const result = await clientsService.changeClientStatus('client-1', { active: false });

    expect(apiClient.patch).toHaveBeenCalledWith('/clients/client-1/status', { active: false });
    expect(result.active).toBe(false);
  });

  it('deleteClient calls DELETE /clients/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ status: 204 });

    await clientsService.deleteClient('client-1');

    expect(apiClient.delete).toHaveBeenCalledWith('/clients/client-1');
  });
});
