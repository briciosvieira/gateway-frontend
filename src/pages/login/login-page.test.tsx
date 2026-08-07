import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/contexts/theme-context';
import { tokenStorage } from '@/lib/api/token-storage';
import i18next from '@/lib/i18n';
import { LoginPage } from '@/pages/login/login-page';
import { PublicRoute } from '@/routes/public-route';
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

function renderLoginPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/login']}>
          <AuthProvider>
            <Routes>
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<LoginPage />} />
              </Route>
              <Route path="/change-password" element={<div>Change password page</div>} />
              <Route path="/" element={<div>Home page</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

function fillAndSubmit(login: string, password: string) {
  fireEvent.change(screen.getByLabelText('Username or email'), { target: { value: login } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
}

describe('LoginPage', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  beforeEach(() => {
    tokenStorage.clear();
  });

  it('redirects to /change-password for a temporary password, without showing a connection error', async () => {
    server.use(
      http.post(`${BASE}/auth/login`, () =>
        HttpResponse.json(
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
        ),
      ),
    );

    renderLoginPage();
    fillAndSubmit('newbie', 'Temp@2026Pass');

    await waitFor(() => expect(screen.getByText('Change password page')).toBeInTheDocument());
    expect(
      screen.queryByText('Unable to connect to the server. Please try again.'),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the invalid-credentials message for a genuine 401, not a connection error', async () => {
    renderLoginPage();
    fillAndSubmit('ada', 'wrong-password');

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid username or password.');
  });

  it('shows the connection-error message for a genuine network failure', async () => {
    server.use(http.post(`${BASE}/auth/login`, () => HttpResponse.error()));

    renderLoginPage();
    fillAndSubmit('ada', 'correct-password');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to connect to the server. Please try again.',
    );
  });

  it('shows the server-error message for a genuine 5xx, not a connection error', async () => {
    server.use(
      http.post(
        `${BASE}/auth/login`,
        () =>
          new HttpResponse(
            JSON.stringify({
              success: false,
              statusCode: 500,
              message: 'Internal server error.',
              error: 'Internal Server Error',
              path: '/api/v1/auth/login',
              method: 'POST',
              requestId: 'req-1',
              timestamp: new Date(0).toISOString(),
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          ),
      ),
    );

    renderLoginPage();
    fillAndSubmit('ada', 'correct-password');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A server error occurred. Please try again later.',
    );
  });
});
