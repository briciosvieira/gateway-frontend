/**
 * Technical storage for auth tokens. Uses localStorage because the backend
 * currently returns tokens in the response body rather than HttpOnly cookies.
 * If the backend migrates the refresh token to an HttpOnly cookie, this
 * module's refresh-token functions become no-ops and can be removed —
 * callers should keep depending on `tokenStorage` rather than localStorage
 * directly, so that migration stays contained here.
 */
const ACCESS_TOKEN_KEY = 'gateway-hub-lf-access-token';
const REFRESH_TOKEN_KEY = 'gateway-hub-lf-refresh-token';

function readToken(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(key);
}

function writeToken(key: string, token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, token);
}

function removeToken(key: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(key);
}

export const tokenStorage = {
  getAccessToken(): string | null {
    return readToken(ACCESS_TOKEN_KEY);
  },
  setAccessToken(token: string): void {
    writeToken(ACCESS_TOKEN_KEY, token);
  },
  removeAccessToken(): void {
    removeToken(ACCESS_TOKEN_KEY);
  },
  getRefreshToken(): string | null {
    return readToken(REFRESH_TOKEN_KEY);
  },
  setRefreshToken(token: string): void {
    writeToken(REFRESH_TOKEN_KEY, token);
  },
  removeRefreshToken(): void {
    removeToken(REFRESH_TOKEN_KEY);
  },
  hasSession(): boolean {
    return readToken(ACCESS_TOKEN_KEY) !== null || readToken(REFRESH_TOKEN_KEY) !== null;
  },
  clear(): void {
    removeToken(ACCESS_TOKEN_KEY);
    removeToken(REFRESH_TOKEN_KEY);
  },
};
