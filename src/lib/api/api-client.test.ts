import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { subscribeToSessionExpired } from '@/features/auth/auth-session-events';
import { apiClient } from '@/lib/api/api-client';
import { tokenStorage } from '@/lib/api/token-storage';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

describe('api-client 401 refresh flow', () => {
  beforeEach(() => {
    tokenStorage.clear();
  });

  it('refreshes the access token once and retries the original request on 401', async () => {
    tokenStorage.setAccessToken('expired-access-token');
    tokenStorage.setRefreshToken('refresh-token-1');

    let refreshCalls = 0;
    server.use(
      http.post(`${BASE}/auth/refresh`, async ({ request }) => {
        refreshCalls += 1;
        const body = (await request.json()) as { refreshToken: string };
        expect(body.refreshToken).toBe('refresh-token-1');

        return HttpResponse.json({
          success: true,
          message: 'ok',
          data: {
            accessToken: 'refreshed-access-token',
            refreshToken: 'refreshed-refresh-token',
            accessTokenExpiresIn: '15m',
            refreshTokenExpiresIn: '7d',
          },
          requestId: 'req-1',
          timestamp: '2026-08-06T12:00:00.000Z',
        });
      }),
    );

    const response = await apiClient.get('/auth/me');

    expect(refreshCalls).toBe(1);
    expect(response.data.data.name).toBe('Ada Lovelace');
    expect(tokenStorage.getAccessToken()).toBe('refreshed-access-token');
    expect(tokenStorage.getRefreshToken()).toBe('refreshed-refresh-token');
  });

  it('clears the session and emits session-expired when the refresh call itself fails', async () => {
    tokenStorage.setAccessToken('expired-access-token');
    tokenStorage.setRefreshToken('invalid-refresh-token');

    const onSessionExpired = vi.fn();
    const unsubscribe = subscribeToSessionExpired(onSessionExpired);

    await expect(apiClient.get('/auth/me')).rejects.toMatchObject({ statusCode: 401 });

    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
    unsubscribe();
  });

  it('does not attempt a refresh for a failed /auth/login request', async () => {
    let refreshCalls = 0;
    server.use(
      http.post(`${BASE}/auth/refresh`, () => {
        refreshCalls += 1;
        return new HttpResponse(null, { status: 401 });
      }),
    );

    await expect(
      apiClient.post('/auth/login', { login: 'ada', password: 'wrong-password' }),
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(refreshCalls).toBe(0);
  });
});
