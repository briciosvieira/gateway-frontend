import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as authService from '@/features/auth/auth.service';
import { apiClient } from '@/lib/api/api-client';

vi.mock('@/lib/api/api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
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

describe('auth.service', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
  });

  it('login posts to /auth/login and unwraps the response envelope', async () => {
    const loginResponse = {
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      accessTokenExpiresIn: '15m',
      refreshTokenExpiresIn: '7d',
      user: {
        name: 'Ada',
        username: 'ada',
        email: 'ada@example.com',
        role: 'ADMIN',
        firstLogin: false,
      },
      mustChangePassword: false,
    };
    vi.mocked(apiClient.post).mockResolvedValue(envelope(loginResponse));

    const result = await authService.login({ login: 'ada', password: 'secret' });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/auth/login',
      { login: 'ada', password: 'secret' },
      { signal: undefined },
    );
    expect(result).toEqual(loginResponse);
  });

  it('refresh posts to /auth/refresh with the refresh token', async () => {
    const tokenPair = {
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
      accessTokenExpiresIn: '15m',
      refreshTokenExpiresIn: '7d',
    };
    vi.mocked(apiClient.post).mockResolvedValue(envelope(tokenPair));

    const result = await authService.refresh('refresh-1');

    expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'refresh-1' });
    expect(result).toEqual(tokenPair);
  });

  it('logout posts to /auth/logout with the refresh token', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: undefined });

    await authService.logout('refresh-1');

    expect(apiClient.post).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'refresh-1' });
  });

  it('getMe gets /auth/me and unwraps the response envelope', async () => {
    const user = {
      id: 'user-1',
      name: 'Ada',
      username: 'ada',
      email: 'ada@example.com',
      active: true,
      firstLogin: false,
      lastLoginAt: null,
      createdAt: '2026-08-06T12:00:00.000Z',
      role: { id: 'role-1', code: 'ADMIN' as const, name: 'Administrator', level: 100 },
    };
    vi.mocked(apiClient.get).mockResolvedValue(envelope(user));

    const result = await authService.getMe();

    expect(apiClient.get).toHaveBeenCalledWith('/auth/me', { signal: undefined });
    expect(result).toEqual(user);
  });

  it('changePassword posts to /auth/change-password with both password fields', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: undefined });

    await authService.changePassword({ currentPassword: 'old', newPassword: 'NewStr0ng!Pass' });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/change-password', {
      currentPassword: 'old',
      newPassword: 'NewStr0ng!Pass',
    });
  });
});
