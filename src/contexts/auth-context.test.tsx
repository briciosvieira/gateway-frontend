import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { AuthProvider } from '@/contexts/auth-context';
import { useAuth } from '@/features/auth/use-auth';
import { useChangePassword } from '@/features/auth/use-change-password';
import { tokenStorage } from '@/lib/api/token-storage';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

function successBody<T>(data: T) {
  return {
    success: true,
    message: 'Request completed successfully.',
    data,
    requestId: 'test-request-id',
    timestamp: new Date(0).toISOString(),
  };
}

function errorBody(statusCode: number, message: string, error: string, code?: string) {
  return {
    success: false,
    statusCode,
    ...(code ? { code } : {}),
    message,
    error,
    path: '/api/v1/test',
    method: 'GET',
    requestId: 'test-request-id',
    timestamp: new Date(0).toISOString(),
  };
}

function TestConsumer() {
  const { user, isAuthenticated, isInitializing, mustChangePassword, login, logout } = useAuth();
  const { submit: submitChangePassword, error: changePasswordError } = useChangePassword();

  return (
    <div>
      <span data-testid="initializing">{String(isInitializing)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user-name">{user?.name ?? ''}</span>
      <span data-testid="must-change-password">{String(mustChangePassword)}</span>
      <span data-testid="change-password-error">{changePasswordError ? 'error' : ''}</span>
      <button onClick={() => login({ login: 'ada', password: 'correct-password' })}>login</button>
      <button
        onClick={() => {
          login({ login: 'ada', password: 'wrong-password' }).catch(() => {});
        }}
      >
        login-invalid
      </button>
      <button
        onClick={() => {
          login({ login: 'newbie', password: 'Temp@2026Pass' }).catch(() => {});
        }}
      >
        login-first-time
      </button>
      <button
        onClick={() =>
          submitChangePassword({ currentPassword: 'Temp@2026Pass', newPassword: 'NewStr0ng!Pass' })
        }
      >
        change-password
      </button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

function renderAuthProvider() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    tokenStorage.clear();
  });

  it('starts unauthenticated when there is no stored session', async () => {
    renderAuthProvider();

    await waitFor(() => expect(screen.getByTestId('initializing').textContent).toBe('false'));
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });

  it('restores an existing session by calling GET /auth/me', async () => {
    tokenStorage.setAccessToken('access-token-1');
    tokenStorage.setRefreshToken('refresh-token-1');

    renderAuthProvider();

    await waitFor(() => expect(screen.getByTestId('authenticated').textContent).toBe('true'));
    expect(screen.getByTestId('user-name').textContent).toBe('Ada Lovelace');
  });

  it('logs in successfully and persists the tokens', async () => {
    renderAuthProvider();
    await waitFor(() => expect(screen.getByTestId('initializing').textContent).toBe('false'));

    fireEvent.click(screen.getByText('login'));

    await waitFor(() => expect(screen.getByTestId('authenticated').textContent).toBe('true'));
    expect(tokenStorage.getAccessToken()).toBe('access-token-1');
    expect(tokenStorage.getRefreshToken()).toBe('refresh-token-1');
  });

  it('rejects invalid credentials without authenticating', async () => {
    renderAuthProvider();
    await waitFor(() => expect(screen.getByTestId('initializing').textContent).toBe('false'));

    fireEvent.click(screen.getByText('login-invalid'));

    await waitFor(() => expect(tokenStorage.getAccessToken()).toBeNull());
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });

  it('logs out and clears the local session', async () => {
    tokenStorage.setAccessToken('access-token-1');
    tokenStorage.setRefreshToken('refresh-token-1');

    renderAuthProvider();
    await waitFor(() => expect(screen.getByTestId('authenticated').textContent).toBe('true'));

    fireEvent.click(screen.getByText('logout'));

    await waitFor(() => expect(screen.getByTestId('authenticated').textContent).toBe('false'));
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  describe('first-login / mandatory password change', () => {
    beforeEach(() => {
      // A first-login user: POST /auth/login succeeds (per the real backend,
      // login always succeeds regardless of firstLogin) but GET /auth/me is
      // blocked by the backend's FirstLoginGuard until the password changes.
      server.use(
        http.post(`${BASE}/auth/login`, async ({ request }) => {
          const body = (await request.json()) as { login: string; password: string };
          if (body.login !== 'newbie' || body.password !== 'Temp@2026Pass') {
            return HttpResponse.json(
              errorBody(401, 'Invalid username, email or password.', 'Unauthorized'),
              { status: 401 },
            );
          }

          return HttpResponse.json(
            successBody({
              accessToken: 'newbie-access-token',
              refreshToken: 'newbie-refresh-token',
              accessTokenExpiresIn: '15m',
              refreshTokenExpiresIn: '7d',
              user: {
                name: 'New User',
                username: 'newbie',
                email: 'newbie@example.com',
                role: 'OPERATOR',
                firstLogin: true,
              },
              mustChangePassword: true,
            }),
          );
        }),
        http.get(`${BASE}/auth/me`, ({ request }) => {
          const authHeader = request.headers.get('authorization');
          if (authHeader === 'Bearer newbie-access-token') {
            return HttpResponse.json(
              errorBody(
                403,
                'Password change is required before accessing this resource.',
                'Forbidden',
                'PASSWORD_CHANGE_REQUIRED',
              ),
              { status: 403 },
            );
          }

          return HttpResponse.json(
            errorBody(401, 'Access token was not provided.', 'Unauthorized'),
            {
              status: 401,
            },
          );
        }),
      );
    });

    it('authenticates on login with a temporary password without showing a connection error', async () => {
      renderAuthProvider();
      await waitFor(() => expect(screen.getByTestId('initializing').textContent).toBe('false'));

      fireEvent.click(screen.getByText('login-first-time'));

      await waitFor(() => expect(screen.getByTestId('authenticated').textContent).toBe('true'));
      expect(screen.getByTestId('must-change-password').textContent).toBe('true');
      expect(tokenStorage.getAccessToken()).toBe('newbie-access-token');
    });

    it('restores a first-login session on page load instead of logging the user out', async () => {
      tokenStorage.setAccessToken('newbie-access-token');
      tokenStorage.setRefreshToken('newbie-refresh-token');

      renderAuthProvider();

      await waitFor(() => expect(screen.getByTestId('initializing').textContent).toBe('false'));
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
      expect(screen.getByTestId('must-change-password').textContent).toBe('true');
      expect(tokenStorage.getAccessToken()).toBe('newbie-access-token');
      expect(tokenStorage.getRefreshToken()).toBe('newbie-refresh-token');
    });

    it('completes the full cycle: temporary password -> change password -> normal session', async () => {
      let passwordChanged = false;

      server.use(
        http.get(`${BASE}/auth/me`, ({ request }) => {
          const authHeader = request.headers.get('authorization');
          if (authHeader !== 'Bearer newbie-access-token') {
            return HttpResponse.json(
              errorBody(401, 'Access token was not provided.', 'Unauthorized'),
              { status: 401 },
            );
          }

          if (!passwordChanged) {
            return HttpResponse.json(
              errorBody(
                403,
                'Password change is required before accessing this resource.',
                'Forbidden',
                'PASSWORD_CHANGE_REQUIRED',
              ),
              { status: 403 },
            );
          }

          return HttpResponse.json(
            successBody({
              id: 'user-newbie',
              name: 'New User',
              username: 'newbie',
              email: 'newbie@example.com',
              active: true,
              firstLogin: false,
              lastLoginAt: null,
              createdAt: new Date(0).toISOString(),
              role: { id: 'role-2', code: 'OPERATOR' as const, name: 'Operator', level: 50 },
            }),
          );
        }),
        http.post(`${BASE}/auth/change-password`, () => {
          passwordChanged = true;
          return new HttpResponse(null, { status: 204 });
        }),
      );

      renderAuthProvider();
      await waitFor(() => expect(screen.getByTestId('initializing').textContent).toBe('false'));

      fireEvent.click(screen.getByText('login-first-time'));
      await waitFor(() =>
        expect(screen.getByTestId('must-change-password').textContent).toBe('true'),
      );

      fireEvent.click(screen.getByText('change-password'));

      await waitFor(() =>
        expect(screen.getByTestId('must-change-password').textContent).toBe('false'),
      );
      expect(screen.getByTestId('user-name').textContent).toBe('New User');
      expect(screen.getByTestId('change-password-error').textContent).toBe('');
    });
  });
});
