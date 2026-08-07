import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as apiKeysService from '@/features/api-keys/api-keys.service';
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

const sampleApiKey = {
  id: 'key-1',
  clientId: 'client-1',
  name: 'Integration Key',
  prefix: 'ghlf_a83f2d1c',
  active: true,
  expiresAt: null,
  lastUsedAt: null,
  revokedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  client: { id: 'client-1', name: 'Acme Corp', code: 'ACME', active: true },
};

describe('api-keys.service', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
    vi.mocked(apiClient.patch).mockReset();
    vi.mocked(apiClient.delete).mockReset();
  });

  it('findApiKeys calls GET /api-keys with the given query params', async () => {
    const paginated = {
      items: [sampleApiKey],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      filters: {},
    };
    vi.mocked(apiClient.get).mockResolvedValue(envelope(paginated));

    const params = { page: 1, limit: 20, search: 'integration', active: true };
    const result = await apiKeysService.findApiKeys(params);

    expect(apiClient.get).toHaveBeenCalledWith('/api-keys', { params, signal: undefined });
    expect(result).toEqual(paginated);
  });

  it('findApiKeyById calls GET /api-keys/:id', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(envelope(sampleApiKey));

    const result = await apiKeysService.findApiKeyById('key-1');

    expect(apiClient.get).toHaveBeenCalledWith('/api-keys/key-1', { signal: undefined });
    expect(result).toEqual(sampleApiKey);
  });

  it('createApiKey calls POST /api-keys and returns the plaintext key once', async () => {
    const createResult = {
      apiKey: sampleApiKey,
      key: 'ghlf_a83f2d1c_secretvalue',
      warning: 'Store this API Key securely. It will not be displayed again.',
    };
    vi.mocked(apiClient.post).mockResolvedValue(envelope(createResult));

    const payload = { name: 'Integration Key', clientId: 'client-1' };
    const result = await apiKeysService.createApiKey(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/api-keys', payload);
    expect(result).toEqual(createResult);
  });

  it('updateApiKey calls PATCH /api-keys/:id with only the given fields', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(envelope(sampleApiKey));

    const result = await apiKeysService.updateApiKey('key-1', { name: 'Renamed Key' });

    expect(apiClient.patch).toHaveBeenCalledWith('/api-keys/key-1', { name: 'Renamed Key' });
    expect(result).toEqual(sampleApiKey);
  });

  it('changeApiKeyStatus calls PATCH /api-keys/:id/status', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(envelope({ ...sampleApiKey, active: false }));

    const result = await apiKeysService.changeApiKeyStatus('key-1', { active: false });

    expect(apiClient.patch).toHaveBeenCalledWith('/api-keys/key-1/status', { active: false });
    expect(result.active).toBe(false);
  });

  it('revokeApiKey calls POST /api-keys/:id/revoke with no body', async () => {
    const revoked = { ...sampleApiKey, active: false, revokedAt: '2026-01-02T00:00:00.000Z' };
    vi.mocked(apiClient.post).mockResolvedValue(envelope(revoked));

    const result = await apiKeysService.revokeApiKey('key-1');

    expect(apiClient.post).toHaveBeenCalledWith('/api-keys/key-1/revoke');
    expect(result.revokedAt).not.toBeNull();
  });

  it('regenerateApiKey calls POST /api-keys/:id/regenerate with the given payload', async () => {
    const regenerateResult = {
      apiKey: { ...sampleApiKey, id: 'key-2', prefix: 'ghlf_b1c2d3e4' },
      key: 'ghlf_b1c2d3e4_newsecret',
      previousApiKeyRevoked: true,
      warning: 'Store this API Key securely. It will not be displayed again.',
    };
    vi.mocked(apiClient.post).mockResolvedValue(envelope(regenerateResult));

    const result = await apiKeysService.regenerateApiKey('key-1', { revokePrevious: true });

    expect(apiClient.post).toHaveBeenCalledWith('/api-keys/key-1/regenerate', {
      revokePrevious: true,
    });
    expect(result).toEqual(regenerateResult);
  });

  it('deleteApiKey calls DELETE /api-keys/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ status: 204 });

    await apiKeysService.deleteApiKey('key-1');

    expect(apiClient.delete).toHaveBeenCalledWith('/api-keys/key-1');
  });
});
