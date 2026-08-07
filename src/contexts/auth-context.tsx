import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { isPasswordChangeRequiredError } from '@/features/auth/auth-errors';
import { subscribeToSessionExpired } from '@/features/auth/auth-session-events';
import * as authService from '@/features/auth/auth.service';
import type { AuthenticatedUser, LoginRequest, LoginResponse } from '@/features/auth/auth.types';
import { getPermissionsForRole, roleHasPermission } from '@/features/auth/role-permissions';
import { queryClient } from '@/lib/api/api-query-client';
import { refreshAccessToken } from '@/lib/api/refresh-token';
import { tokenStorage } from '@/lib/api/token-storage';

interface AuthContextValue {
  user: AuthenticatedUser | null;
  permissions: string[];
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoggingOut: boolean;
  mustChangePassword: boolean;

  login(payload: LoginRequest): Promise<LoginResponse>;
  logout(): Promise<void>;
  refreshSession(): Promise<boolean>;
  reloadUser(): Promise<void>;
  hasPermission(permission: string): boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const loadUser = useCallback(async () => {
    const me = await authService.getMe();
    setUser(me);
    setMustChangePassword(me.firstLogin);
    return me;
  }, []);

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setMustChangePassword(false);
    queryClient.clear();
  }, []);

  useEffect(() => {
    let active = true;

    async function initialize() {
      if (!tokenStorage.hasSession()) {
        if (active) setIsInitializing(false);
        return;
      }

      try {
        await loadUser();
      } catch (error) {
        // A first-login user whose access token is still valid gets a 403
        // PASSWORD_CHANGE_REQUIRED from GET /auth/me (blocked by the
        // backend's FirstLoginGuard) — the session itself is fine, so keep
        // it instead of logging them out from under the change-password page.
        if (isPasswordChangeRequiredError(error)) {
          if (active) setMustChangePassword(true);
        } else {
          clearSession();
        }
      } finally {
        if (active) setIsInitializing(false);
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, [loadUser, clearSession]);

  useEffect(() => subscribeToSessionExpired(clearSession), [clearSession]);

  const login = useCallback(
    async (payload: LoginRequest): Promise<LoginResponse> => {
      const response = await authService.login(payload);
      tokenStorage.setAccessToken(response.accessToken);
      tokenStorage.setRefreshToken(response.refreshToken);

      if (response.mustChangePassword) {
        // GET /auth/me is blocked by the backend's FirstLoginGuard until the
        // password is changed (403 PASSWORD_CHANGE_REQUIRED) — calling
        // loadUser() here would always fail. `user` stays null; reloadUser()
        // after a successful change-password populates it for real.
        setUser(null);
        setMustChangePassword(true);
        return response;
      }

      await loadUser();
      return response;
    },
    [loadUser],
  );

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    const refreshToken = tokenStorage.getRefreshToken();

    try {
      await authService.logout(refreshToken ?? undefined);
    } catch {
      // Logout must succeed locally even if the backend call fails (e.g.
      // offline) — the point is to end the local session regardless.
    } finally {
      clearSession();
      setIsLoggingOut(false);
    }
  }, [clearSession]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const newAccessToken = await refreshAccessToken();
    if (!newAccessToken) {
      clearSession();
      return false;
    }

    try {
      await loadUser();
      return true;
    } catch (error) {
      // Same first-login carve-out as initialize() above — the refreshed
      // session is valid, the user just still owes a password change.
      if (isPasswordChangeRequiredError(error)) {
        setMustChangePassword(true);
        return true;
      }

      clearSession();
      return false;
    }
  }, [loadUser, clearSession]);

  const reloadUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  const hasPermission = useCallback(
    (permission: string) => (user ? roleHasPermission(user.role.code, permission) : false),
    [user],
  );

  const permissions = useMemo(() => (user ? getPermissionsForRole(user.role.code) : []), [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      permissions,
      // A first-login user is authenticated (valid tokens, session exists)
      // before `user` can ever be populated — GET /auth/me is blocked until
      // the password change is done. See login()/initialize() above.
      isAuthenticated: user !== null || mustChangePassword,
      isInitializing,
      isLoggingOut,
      mustChangePassword,
      login,
      logout,
      refreshSession,
      reloadUser,
      hasPermission,
    }),
    [
      user,
      permissions,
      isInitializing,
      isLoggingOut,
      mustChangePassword,
      login,
      logout,
      refreshSession,
      reloadUser,
      hasPermission,
    ],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
