import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as usersService from '@/features/users/users.service';
import { apiClient } from '@/lib/api/api-client';

vi.mock('@/lib/api/api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
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

const sampleUser = {
  id: 'user-1',
  name: 'Ada Lovelace',
  username: 'ada',
  email: 'ada@example.com',
  active: true,
  firstLogin: false,
  lastLoginAt: '2026-08-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  role: { id: 'role-1', code: 'ADMIN' as const, name: 'Administrator', level: 100 },
};

describe('users.service', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
    vi.mocked(apiClient.patch).mockReset();
    vi.mocked(apiClient.delete).mockReset();
  });

  it('findUsers calls GET /users with no query params', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(envelope([sampleUser]));

    const result = await usersService.findUsers();

    expect(apiClient.get).toHaveBeenCalledWith('/users', { signal: undefined });
    expect(result).toEqual([sampleUser]);
  });

  it('findUserById calls GET /users/:id', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(envelope(sampleUser));

    const result = await usersService.findUserById('user-1');

    expect(apiClient.get).toHaveBeenCalledWith('/users/user-1', { signal: undefined });
    expect(result).toEqual(sampleUser);
  });

  it('createUser calls POST /users and returns the temporary password envelope', async () => {
    const createResult = {
      user: sampleUser,
      temporaryPassword: 'Abc@12345678',
      passwordMustBeChanged: true,
    };
    vi.mocked(apiClient.post).mockResolvedValue(envelope(createResult));

    const payload = {
      name: 'Ada Lovelace',
      username: 'ada',
      email: 'ada@example.com',
      roleId: 'role-1',
      requirePasswordChange: true,
    };
    const result = await usersService.createUser(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/users', payload);
    expect(result).toEqual(createResult);
  });

  it('updateUser calls PATCH /users/:id with only the given fields', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(envelope(sampleUser));

    const result = await usersService.updateUser('user-1', { name: 'Ada' });

    expect(apiClient.patch).toHaveBeenCalledWith('/users/user-1', { name: 'Ada' });
    expect(result).toEqual(sampleUser);
  });

  it('changeUserRole calls PATCH /users/:id/role', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(envelope(sampleUser));

    const result = await usersService.changeUserRole('user-1', { roleId: 'role-2' });

    expect(apiClient.patch).toHaveBeenCalledWith('/users/user-1/role', { roleId: 'role-2' });
    expect(result).toEqual(sampleUser);
  });

  it('changeUserStatus calls PATCH /users/:id/status', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(envelope({ ...sampleUser, active: false }));

    const result = await usersService.changeUserStatus('user-1', { active: false });

    expect(apiClient.patch).toHaveBeenCalledWith('/users/user-1/status', { active: false });
    expect(result.active).toBe(false);
  });

  it('resetUserPassword calls POST /users/:id/reset-password with no body', async () => {
    const resetResult = { temporaryPassword: 'Xyz@98765432', passwordMustBeChanged: true };
    vi.mocked(apiClient.post).mockResolvedValue(envelope(resetResult));

    const result = await usersService.resetUserPassword('user-1');

    expect(apiClient.post).toHaveBeenCalledWith('/users/user-1/reset-password');
    expect(result).toEqual(resetResult);
  });

  it('changePasswordRequirement calls PATCH /users/:id/password-requirement', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(envelope({ ...sampleUser, firstLogin: true }));

    const result = await usersService.changePasswordRequirement('user-1', {
      requirePasswordChange: true,
    });

    expect(apiClient.patch).toHaveBeenCalledWith('/users/user-1/password-requirement', {
      requirePasswordChange: true,
    });
    expect(result.firstLogin).toBe(true);
  });

  it('findAssignableRoles calls GET /roles', async () => {
    const roles = [
      {
        id: 'role-1',
        code: 'ADMIN' as const,
        name: 'Administrator',
        description: null,
        level: 100,
      },
    ];
    vi.mocked(apiClient.get).mockResolvedValue(envelope(roles));

    const result = await usersService.findAssignableRoles();

    expect(apiClient.get).toHaveBeenCalledWith('/roles', { signal: undefined });
    expect(result).toEqual(roles);
  });

  it('deleteUser calls DELETE /users/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ status: 204 });

    await usersService.deleteUser('user-1');

    expect(apiClient.delete).toHaveBeenCalledWith('/users/user-1');
  });
});
