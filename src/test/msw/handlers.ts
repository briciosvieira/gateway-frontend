import { HttpResponse, http } from 'msw';

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

function errorBody(statusCode: number, message: string | string[], error: string, code?: string) {
  return {
    success: false,
    statusCode,
    ...(code ? { code } : {}),
    message,
    error,
    path: '/api/v1/test',
    method: 'POST',
    requestId: 'test-request-id',
    timestamp: new Date(0).toISOString(),
  };
}

export const testUser = {
  id: 'user-1',
  name: 'Ada Lovelace',
  username: 'ada',
  email: 'ada@example.com',
  active: true,
  firstLogin: false,
  lastLoginAt: null,
  createdAt: new Date(0).toISOString(),
  role: { id: 'role-1', code: 'ADMIN' as const, name: 'Administrator', level: 100 },
};

export const handlers = [
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { login: string; password: string };

    if (body.login === 'ada' && body.password === 'correct-password') {
      return HttpResponse.json(
        successBody({
          accessToken: 'access-token-1',
          refreshToken: 'refresh-token-1',
          accessTokenExpiresIn: '15m',
          refreshTokenExpiresIn: '7d',
          user: {
            name: testUser.name,
            username: testUser.username,
            email: testUser.email,
            role: testUser.role.code,
            firstLogin: testUser.firstLogin,
          },
          mustChangePassword: testUser.firstLogin,
        }),
      );
    }

    return HttpResponse.json(
      errorBody(401, 'Invalid username, email or password.', 'Unauthorized'),
      { status: 401 },
    );
  }),

  http.get(`${BASE}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('authorization');

    if (authHeader === 'Bearer access-token-1' || authHeader === 'Bearer refreshed-access-token') {
      return HttpResponse.json(successBody(testUser));
    }

    return HttpResponse.json(errorBody(401, 'Access token was not provided.', 'Unauthorized'), {
      status: 401,
    });
  }),

  http.post(`${BASE}/auth/refresh`, async ({ request }) => {
    const body = (await request.json()) as { refreshToken: string };

    if (body.refreshToken === 'refresh-token-1' || body.refreshToken === 'valid-refresh-token') {
      return HttpResponse.json(
        successBody({
          accessToken: 'refreshed-access-token',
          refreshToken: 'refreshed-refresh-token',
          accessTokenExpiresIn: '15m',
          refreshTokenExpiresIn: '7d',
        }),
      );
    }

    return HttpResponse.json(
      errorBody(401, 'Refresh token is invalid or revoked.', 'Unauthorized'),
      { status: 401 },
    );
  }),

  http.post(`${BASE}/auth/logout`, () => new HttpResponse(null, { status: 204 })),

  http.post(`${BASE}/auth/change-password`, () => new HttpResponse(null, { status: 204 })),
];
