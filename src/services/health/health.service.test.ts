import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/lib/api/api-client';
import { getHealth } from '@/services/health/health.service';

vi.mock('@/lib/api/api-client', () => ({
  apiClient: { get: vi.fn() },
}));

describe('getHealth', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
  });

  it('unwraps the success envelope and returns the health payload', async () => {
    const healthPayload = {
      status: 'ok',
      application: 'Gateway Hub LF',
      database: 'connected',
      timestamp: '2026-08-06T12:00:00.000Z',
      uptime: 123.45,
    };

    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        success: true,
        message: 'Request completed successfully.',
        data: healthPayload,
        requestId: 'req-123',
        timestamp: '2026-08-06T12:00:00.000Z',
      },
    });

    const result = await getHealth();

    expect(result).toEqual(healthPayload);
    expect(apiClient.get).toHaveBeenCalledWith('/health', { signal: undefined });
  });

  it('forwards the abort signal to the HTTP client', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: {
          status: 'ok',
          application: 'Gateway Hub LF',
          database: 'connected',
          timestamp: '2026-08-06T12:00:00.000Z',
          uptime: 1,
        },
        requestId: 'req-123',
        timestamp: '2026-08-06T12:00:00.000Z',
      },
    });

    const controller = new AbortController();
    await getHealth(controller.signal);

    expect(apiClient.get).toHaveBeenCalledWith('/health', { signal: controller.signal });
  });
});
