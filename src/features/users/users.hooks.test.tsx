import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { useCreateUser, useUsers } from '@/features/users/users.hooks';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

const sampleUser = {
  id: 'user-1',
  name: 'Ada Lovelace',
  username: 'ada',
  email: 'ada@example.com',
  active: true,
  firstLogin: false,
  lastLoginAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  role: { id: 'role-1', code: 'ADMIN', name: 'Administrator', level: 100 },
};

function successBody<T>(data: T) {
  return {
    success: true,
    message: 'Request completed successfully.',
    data,
    requestId: 'req-1',
    timestamp: '2026-08-06T12:00:00.000Z',
  };
}

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return {
    Wrapper: function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    },
    queryClient,
  };
}

describe('useUsers', () => {
  it('fetches the bare user list with no query params', async () => {
    let requestUrl: URL | undefined;

    server.use(
      http.get(`${BASE}/users`, ({ request }) => {
        requestUrl = new URL(request.url);
        return HttpResponse.json(successBody([sampleUser]));
      }),
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUsers(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual([sampleUser]);
    expect(requestUrl?.search).toBe('');
  });
});

describe('useCreateUser', () => {
  it('invalidates the users list query on success', async () => {
    let listRequestCount = 0;

    server.use(
      http.get(`${BASE}/users`, () => {
        listRequestCount += 1;
        return HttpResponse.json(successBody([sampleUser]));
      }),
      http.post(`${BASE}/users`, () =>
        HttpResponse.json(
          successBody({
            user: sampleUser,
            temporaryPassword: 'Abc@12345678',
            passwordMustBeChanged: true,
          }),
        ),
      ),
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result: usersResult } = renderHook(() => useUsers(), { wrapper: Wrapper });
    await waitFor(() => expect(usersResult.current.isLoading).toBe(false));
    expect(listRequestCount).toBe(1);

    const { result: createResult } = renderHook(() => useCreateUser(), { wrapper: Wrapper });
    await createResult.current.mutateAsync({
      name: 'New User',
      username: 'newuser',
      email: 'new@example.com',
      roleId: 'role-2',
      requirePasswordChange: true,
    });

    await waitFor(() =>
      expect(queryClient.getQueryState(['users', 'list'])?.isInvalidated).toBe(true),
    );
  });
});
