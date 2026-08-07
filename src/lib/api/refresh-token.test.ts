import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/lib/api/api-client';
import { refreshAccessToken } from '@/lib/api/refresh-token';
import { tokenStorage } from '@/lib/api/token-storage';

vi.mock('@/lib/api/api-client', () => ({
  apiClient: { post: vi.fn() },
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('refreshAccessToken', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset();
    tokenStorage.clear();
  });

  it('returns null without calling the API when there is no refresh token', async () => {
    const result = await refreshAccessToken();

    expect(result).toBeNull();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('stores the new tokens and returns the new access token on success', async () => {
    tokenStorage.setRefreshToken('refresh-1');
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: {
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
          accessTokenExpiresIn: '15m',
          refreshTokenExpiresIn: '7d',
        },
        requestId: 'req-1',
        timestamp: '2026-08-06T12:00:00.000Z',
      },
    });

    const result = await refreshAccessToken();

    expect(result).toBe('new-access');
    expect(tokenStorage.getAccessToken()).toBe('new-access');
    expect(tokenStorage.getRefreshToken()).toBe('new-refresh');
  });

  it('returns null and leaves tokens untouched when the refresh call fails', async () => {
    tokenStorage.setRefreshToken('refresh-1');
    vi.mocked(apiClient.post).mockRejectedValue(new Error('refresh failed'));

    const result = await refreshAccessToken();

    expect(result).toBeNull();
    expect(tokenStorage.getAccessToken()).toBeNull();
  });

  it('shares a single in-flight request across concurrent callers', async () => {
    tokenStorage.setRefreshToken('refresh-1');
    const { promise, resolve } = deferred<{ data: unknown }>();
    vi.mocked(apiClient.post).mockReturnValue(promise as never);

    const first = refreshAccessToken();
    const second = refreshAccessToken();

    resolve({
      data: {
        success: true,
        message: 'ok',
        data: {
          accessToken: 'shared-access',
          refreshToken: 'shared-refresh',
          accessTokenExpiresIn: '15m',
          refreshTokenExpiresIn: '7d',
        },
        requestId: 'req-1',
        timestamp: '2026-08-06T12:00:00.000Z',
      },
    });

    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(apiClient.post).toHaveBeenCalledTimes(1);
    expect(firstResult).toBe('shared-access');
    expect(secondResult).toBe('shared-access');
  });

  it('allows a new refresh after the previous one finished', async () => {
    tokenStorage.setRefreshToken('refresh-1');
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: {
          accessToken: 'access-a',
          refreshToken: 'refresh-a',
          accessTokenExpiresIn: '15m',
          refreshTokenExpiresIn: '7d',
        },
        requestId: 'req-1',
        timestamp: '2026-08-06T12:00:00.000Z',
      },
    });

    await refreshAccessToken();
    await refreshAccessToken();

    expect(apiClient.post).toHaveBeenCalledTimes(2);
  });
});
