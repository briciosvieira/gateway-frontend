import { beforeEach, describe, expect, it } from 'vitest';

import { tokenStorage } from '@/lib/api/token-storage';

describe('tokenStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns null when no access token was stored', () => {
    expect(tokenStorage.getAccessToken()).toBeNull();
  });

  it('stores and retrieves the access token', () => {
    tokenStorage.setAccessToken('access-123');
    expect(tokenStorage.getAccessToken()).toBe('access-123');
  });

  it('removes only the access token', () => {
    tokenStorage.setAccessToken('access-123');
    tokenStorage.setRefreshToken('refresh-123');

    tokenStorage.removeAccessToken();

    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBe('refresh-123');
  });

  it('stores and retrieves the refresh token', () => {
    tokenStorage.setRefreshToken('refresh-123');
    expect(tokenStorage.getRefreshToken()).toBe('refresh-123');
  });

  it('removes only the refresh token', () => {
    tokenStorage.setAccessToken('access-123');
    tokenStorage.setRefreshToken('refresh-123');

    tokenStorage.removeRefreshToken();

    expect(tokenStorage.getRefreshToken()).toBeNull();
    expect(tokenStorage.getAccessToken()).toBe('access-123');
  });

  it('clears both tokens', () => {
    tokenStorage.setAccessToken('access-123');
    tokenStorage.setRefreshToken('refresh-123');

    tokenStorage.clear();

    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  it('reports no session when no token is stored', () => {
    expect(tokenStorage.hasSession()).toBe(false);
  });

  it('reports a session when only the access token is stored', () => {
    tokenStorage.setAccessToken('access-123');
    expect(tokenStorage.hasSession()).toBe(true);
  });

  it('reports a session when only the refresh token is stored', () => {
    tokenStorage.setRefreshToken('refresh-123');
    expect(tokenStorage.hasSession()).toBe(true);
  });

  it('reports no session after clear()', () => {
    tokenStorage.setAccessToken('access-123');
    tokenStorage.setRefreshToken('refresh-123');
    tokenStorage.clear();

    expect(tokenStorage.hasSession()).toBe(false);
  });
});
