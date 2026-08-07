import { apiClient } from '@/lib/api/api-client';
import { tokenStorage } from '@/lib/api/token-storage';
import type { ApiSuccessResponse } from '@/types/api';

interface RefreshTokenPayload {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await apiClient.post<ApiSuccessResponse<RefreshTokenPayload>>(
      '/auth/refresh',
      { refreshToken },
    );

    const tokens = response.data.data;
    tokenStorage.setAccessToken(tokens.accessToken);
    tokenStorage.setRefreshToken(tokens.refreshToken);
    return tokens.accessToken;
  } catch {
    return null;
  }
}

/**
 * Ensures at most one POST /auth/refresh request is ever in flight. If
 * several requests fail with 401 at the same time, they all await the same
 * shared promise instead of each firing its own refresh call.
 */
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}
