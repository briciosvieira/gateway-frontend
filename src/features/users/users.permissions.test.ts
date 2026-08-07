import { describe, expect, it } from 'vitest';

import type { AuthenticatedUser } from '@/features/auth/auth.types';
import {
  canChangeOwnAdminRole,
  canDeactivate,
  canManageTargetRole,
} from '@/features/users/users.permissions';
import type { UserListItem } from '@/features/users/users.types';

function makeAuthUser(overrides: Partial<AuthenticatedUser>): AuthenticatedUser {
  return {
    id: 'current-user',
    name: 'Current User',
    username: 'current',
    email: 'current@example.com',
    active: true,
    firstLogin: false,
    lastLoginAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    role: { id: 'role-1', code: 'ADMIN', name: 'Administrator', level: 100 },
    ...overrides,
  };
}

function makeTarget(overrides: Partial<UserListItem>): UserListItem {
  return {
    id: 'target-user',
    name: 'Target User',
    username: 'target',
    email: 'target@example.com',
    active: true,
    firstLogin: false,
    lastLoginAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    role: { id: 'role-2', code: 'VIEWER', name: 'Viewer', level: 10 },
    ...overrides,
  };
}

describe('canManageTargetRole', () => {
  it('lets ADMIN manage any role, including ADMIN targets', () => {
    expect(canManageTargetRole('ADMIN', 'ADMIN')).toBe(true);
    expect(canManageTargetRole('ADMIN', 'OPERATOR')).toBe(true);
  });

  it('blocks OPERATOR from managing ADMIN targets, but allows everything else', () => {
    expect(canManageTargetRole('OPERATOR', 'ADMIN')).toBe(false);
    expect(canManageTargetRole('OPERATOR', 'OPERATOR')).toBe(true);
    expect(canManageTargetRole('OPERATOR', 'VIEWER')).toBe(true);
    expect(canManageTargetRole('OPERATOR', 'AUDITOR')).toBe(true);
  });

  it('VIEWER and AUDITOR cannot manage anyone (mirrors the 403 on every /users endpoint)', () => {
    expect(canManageTargetRole('VIEWER', 'VIEWER')).toBe(false);
    expect(canManageTargetRole('AUDITOR', 'AUDITOR')).toBe(false);
  });
});

describe('canDeactivate', () => {
  it('blocks self-deactivation', () => {
    const currentUser = makeAuthUser({ id: 'same-id' });
    const target = makeTarget({ id: 'same-id' });
    expect(canDeactivate(currentUser, target)).toBe(false);
  });

  it('allows deactivating someone else', () => {
    const currentUser = makeAuthUser({ id: 'admin-1' });
    const target = makeTarget({ id: 'user-2' });
    expect(canDeactivate(currentUser, target)).toBe(true);
  });
});

describe('canChangeOwnAdminRole', () => {
  it('blocks an ADMIN from demoting their own admin role', () => {
    const currentUser = makeAuthUser({
      id: 'same-id',
      role: { id: 'r', code: 'ADMIN', name: 'Administrator', level: 100 },
    });
    const target = makeTarget({
      id: 'same-id',
      role: { id: 'r', code: 'ADMIN', name: 'Administrator', level: 100 },
    });
    expect(canChangeOwnAdminRole(currentUser, target)).toBe(false);
  });

  it('allows changing someone else’s admin role', () => {
    const currentUser = makeAuthUser({ id: 'admin-1' });
    const target = makeTarget({
      id: 'admin-2',
      role: { id: 'r', code: 'ADMIN', name: 'Administrator', level: 100 },
    });
    expect(canChangeOwnAdminRole(currentUser, target)).toBe(true);
  });

  it('allows changing your own role when you are not currently ADMIN', () => {
    const currentUser = makeAuthUser({
      id: 'same-id',
      role: { id: 'r', code: 'OPERATOR', name: 'Operator', level: 50 },
    });
    const target = makeTarget({
      id: 'same-id',
      role: { id: 'r', code: 'OPERATOR', name: 'Operator', level: 50 },
    });
    expect(canChangeOwnAdminRole(currentUser, target)).toBe(true);
  });
});
