import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as requestLogsService from '@/features/request-logs/request-logs.service';
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
      timestamp: '2026-08-07T12:00:00.000Z',
    },
  };
}

const sampleRequestLog = {
  id: 'log-1',
  requestId: 'req-1',
  attemptedAt: '2026-08-07T12:00:00.000Z',
  requestOrigin: 'PUBLIC' as const,
  sourceHost: 'hub.example.com',
  clientId: 'client-1',
  apiKeyId: 'api-key-1',
  gatewayRouteId: 'route-1',
  sourceIp: '177.1.1.1',
  method: 'POST',
  publicPath: '/gateway/webhook',
  publicEndpoint: 'https://hub.example.com/gateway/webhook',
  destinationHost: 'n8n.internal',
  destinationIp: '10.0.0.1',
  statusCode: 200,
  durationMs: 184,
  attempts: 1,
  result: 'SUCCESS' as const,
  errorCode: null,
  errorMessage: null,
  requestSizeBytes: 120,
  responseSizeBytes: 340,
  createdAt: '2026-08-07T12:00:01.000Z',
  client: { id: 'client-1', name: 'Syngoo', code: 'syngoo' },
  apiKey: { id: 'api-key-1', name: 'Primary key' },
  gatewayRoute: { id: 'route-1', name: 'Webhook', slug: '/webhook', method: 'POST' },
  destinationUrl: 'https://n8n.internal/webhook',
  upstreamStatusCode: 200,
  requestHeaders: { authorization: '********' },
  requestQuery: { foo: 'bar' },
  requestBody: { ok: true },
  responseHeaders: { 'content-type': 'application/json' },
  responseBody: { success: true },
};

describe('request-logs.service', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
  });

  it('findRequestLogs calls GET /request-logs with filters, pagination and AbortSignal', async () => {
    const signal = new AbortController().signal;
    const paginated = {
      items: [sampleRequestLog],
      pagination: { page: 2, limit: 20, total: 1, totalPages: 1 },
    };
    vi.mocked(apiClient.get).mockResolvedValue(envelope(paginated));

    const params = {
      page: 2,
      limit: 20,
      search: 'syngoo',
      clientId: 'client-1',
      requestOrigin: 'PUBLIC' as const,
      statusCode: 200,
      sortBy: 'attemptedAt' as const,
      sortOrder: 'desc' as const,
    };

    const result = await requestLogsService.findRequestLogs(params, signal);

    expect(apiClient.get).toHaveBeenCalledWith('/request-logs', { params, signal });
    expect(result).toEqual(paginated);
  });

  it('findRequestLogById calls GET /request-logs/:id with the AbortSignal', async () => {
    const signal = new AbortController().signal;
    vi.mocked(apiClient.get).mockResolvedValue(envelope(sampleRequestLog));

    const result = await requestLogsService.findRequestLogById('log-1', signal);

    expect(apiClient.get).toHaveBeenCalledWith('/request-logs/log-1', { signal });
    expect(result).toEqual(sampleRequestLog);
  });

  it('findRequestLogByRequestId calls GET /request-logs/by-request-id/:requestId', async () => {
    const signal = new AbortController().signal;
    vi.mocked(apiClient.get).mockResolvedValue(envelope(sampleRequestLog));

    const result = await requestLogsService.findRequestLogByRequestId('req-1', signal);

    expect(apiClient.get).toHaveBeenCalledWith('/request-logs/by-request-id/req-1', { signal });
    expect(result).toEqual(sampleRequestLog);
  });
});
