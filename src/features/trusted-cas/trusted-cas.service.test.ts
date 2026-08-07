import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as trustedCasService from '@/features/trusted-cas/trusted-cas.service';
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

describe('trusted-cas.service', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
    vi.mocked(apiClient.patch).mockReset();
    vi.mocked(apiClient.delete).mockReset();
  });

  it('findTrustedCas calls GET /trusted-cas with the given query params', async () => {
    const paginated = {
      items: [sampleTrustedCa],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      filters: {},
    };
    vi.mocked(apiClient.get).mockResolvedValue(envelope(paginated));

    const params = { page: 1, limit: 20, search: 'root', active: true, validity: 'valid' as const };
    const result = await trustedCasService.findTrustedCas(params);

    expect(apiClient.get).toHaveBeenCalledWith('/trusted-cas', { params, signal: undefined });
    expect(result).toEqual(paginated);
  });

  it('findTrustedCaById calls GET /trusted-cas/:id', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(envelope(sampleTrustedCa));

    const result = await trustedCasService.findTrustedCaById('ca-1');

    expect(apiClient.get).toHaveBeenCalledWith('/trusted-cas/ca-1', { signal: undefined });
    expect(result).toEqual(sampleTrustedCa);
  });

  it('createTrustedCa posts a multipart FormData with exactly the real field names (name, file)', async () => {
    vi.mocked(apiClient.post).mockResolvedValue(envelope(sampleTrustedCa));

    const file = new File(['cert-bytes'], 'root-ca.pem', { type: 'application/x-pem-file' });
    const result = await trustedCasService.createTrustedCa({ name: 'Internal Root CA', file });

    expect(apiClient.post).toHaveBeenCalledTimes(1);
    const [url, body] = vi.mocked(apiClient.post).mock.calls[0];
    expect(url).toBe('/trusted-cas');
    expect(body).toBeInstanceOf(FormData);

    const formData = body as FormData;
    expect(formData.get('name')).toBe('Internal Root CA');
    expect(formData.get('file')).toBe(file);
    // Never a JSON/base64 encoding of the file — the raw File must travel as-is.
    expect(typeof formData.get('file')).not.toBe('string');
    expect(result).toEqual(sampleTrustedCa);
  });

  it('changeTrustedCaStatus calls PATCH /trusted-cas/:id/status', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(envelope({ ...sampleTrustedCa, active: false }));

    const result = await trustedCasService.changeTrustedCaStatus('ca-1', { active: false });

    expect(apiClient.patch).toHaveBeenCalledWith('/trusted-cas/ca-1/status', { active: false });
    expect(result.active).toBe(false);
  });

  it('deleteTrustedCa calls DELETE /trusted-cas/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ status: 204 });

    await trustedCasService.deleteTrustedCa('ca-1');

    expect(apiClient.delete).toHaveBeenCalledWith('/trusted-cas/ca-1');
  });
});
