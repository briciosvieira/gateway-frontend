import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { UserDeleteDialog } from '@/components/users/user-delete-dialog';
import type { UserListItem } from '@/features/users/users.types';
import i18next from '@/lib/i18n';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

const USER: UserListItem = {
  id: 'user-1',
  name: 'Row User',
  username: 'rowuser',
  email: 'row@example.com',
  active: true,
  firstLogin: false,
  lastLoginAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  role: { id: 'role-2', code: 'VIEWER', name: 'Viewer', level: 10 },
};

function errorEnvelope(statusCode: number, message: string) {
  return {
    success: false,
    statusCode,
    message,
    error: 'Error',
    path: '/api/v1/users/user-1',
    method: 'DELETE',
    requestId: 'req-1',
    timestamp: '2026-08-06T12:00:00.000Z',
  };
}

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('UserDeleteDialog', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('does not call the API when cancel is clicked', () => {
    let called = false;
    server.use(
      http.delete(`${BASE}/users/user-1`, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const onOpenChange = vi.fn();
    render(<UserDeleteDialog open user={USER} onOpenChange={onOpenChange} onSuccess={() => {}} />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(called).toBe(false);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls DELETE /users/:id and onSuccess when confirmed', async () => {
    let called = false;
    server.use(
      http.delete(`${BASE}/users/user-1`, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const onSuccess = vi.fn();
    render(<UserDeleteDialog open user={USER} onOpenChange={() => {}} onSuccess={onSuccess} />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(called).toBe(true);
  });

  it('blocks a second click while the deletion is in flight', async () => {
    let callCount = 0;
    server.use(
      http.delete(`${BASE}/users/user-1`, async () => {
        callCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 30));
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const onSuccess = vi.fn();
    render(<UserDeleteDialog open user={USER} onOpenChange={() => {}} onSuccess={onSuccess} />, {
      wrapper: createWrapper(),
    });

    const button = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(button);
    fireEvent.click(button);

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(callCount).toBe(1);
  });

  it('shows the forbidden message on 403 (e.g. last-admin/self-delete block)', async () => {
    server.use(
      http.delete(`${BASE}/users/user-1`, () =>
        HttpResponse.json(errorEnvelope(403, 'LAST_ADMIN_CANNOT_BE_DELETED'), { status: 403 }),
      ),
    );

    render(<UserDeleteDialog open user={USER} onOpenChange={() => {}} onSuccess={() => {}} />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You do not have permission to delete this record.',
    );
  });

  it('shows the not-found message on 404', async () => {
    server.use(
      http.delete(`${BASE}/users/user-1`, () =>
        HttpResponse.json(errorEnvelope(404, 'User was not found.'), { status: 404 }),
      ),
    );

    render(<UserDeleteDialog open user={USER} onOpenChange={() => {}} onSuccess={() => {}} />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The record no longer exists.');
  });
});
