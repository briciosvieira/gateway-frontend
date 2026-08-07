import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { UsersTable } from '@/components/users/users-table';
import type { AuthenticatedUser } from '@/features/auth/auth.types';
import type { UserListItem } from '@/features/users/users.types';
import i18next from '@/lib/i18n';

function makeCurrentUser(overrides: Partial<AuthenticatedUser>): AuthenticatedUser {
  return {
    id: 'current-user',
    name: 'Current User',
    username: 'current',
    email: 'current@example.com',
    active: true,
    firstLogin: false,
    lastLoginAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    role: { id: 'role-admin', code: 'ADMIN', name: 'Administrator', level: 100 },
    ...overrides,
  };
}

function makeRow(overrides: Partial<UserListItem>): UserListItem {
  return {
    id: 'row-1',
    name: 'Row User',
    username: 'rowuser',
    email: 'row@example.com',
    active: true,
    firstLogin: false,
    lastLoginAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    role: { id: 'role-2', code: 'VIEWER', name: 'Viewer', level: 10 },
    ...overrides,
  };
}

const ALL_PERMISSIONS = {
  canUpdate: true,
  canChangeStatus: true,
  canChangeRole: true,
  canResetPassword: true,
  canChangePasswordRequirement: true,
  canDelete: true,
};

const NOOP_ACTIONS = {
  onView: vi.fn(),
  onEdit: vi.fn(),
  onToggleStatus: vi.fn(),
  onChangeRole: vi.fn(),
  onChangePasswordRequirement: vi.fn(),
  onResetPassword: vi.fn(),
  onDelete: vi.fn(),
};

async function openRowMenu() {
  const trigger = screen.getByRole('button', { name: 'Actions' });
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false, pointerType: 'mouse' });
  fireEvent.pointerUp(trigger, { button: 0, ctrlKey: false, pointerType: 'mouse' });
  fireEvent.click(trigger);
  return screen.findByRole('menu');
}

describe('UsersTable', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('renders the row data', () => {
    render(
      <UsersTable
        rows={[makeRow({ name: 'Ada Lovelace', username: 'ada' })]}
        currentUser={makeCurrentUser({})}
        permissions={ALL_PERMISSIONS}
        {...NOOP_ACTIONS}
      />,
    );

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('ada')).toBeInTheDocument();
  });

  it('shows every action when the current user has full permissions and can manage the target', async () => {
    render(
      <UsersTable
        rows={[makeRow({ id: 'row-1' })]}
        currentUser={makeCurrentUser({})}
        permissions={ALL_PERMISSIONS}
        {...NOOP_ACTIONS}
      />,
    );

    await openRowMenu();

    expect(screen.getByRole('menuitem', { name: /Edit/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Deactivate/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Change role/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Reset password/ })).toBeInTheDocument();
  });

  it('hides management actions when an OPERATOR views an ADMIN target', async () => {
    render(
      <UsersTable
        rows={[
          makeRow({
            id: 'row-1',
            role: { id: 'r', code: 'ADMIN', name: 'Administrator', level: 100 },
          }),
        ]}
        currentUser={makeCurrentUser({
          id: 'operator-1',
          role: { id: 'role-operator', code: 'OPERATOR', name: 'Operator', level: 50 },
        })}
        permissions={ALL_PERMISSIONS}
        {...NOOP_ACTIONS}
      />,
    );

    await openRowMenu();

    expect(screen.queryByRole('menuitem', { name: /Edit/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Deactivate/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Change role/ })).not.toBeInTheDocument();
    // View is always available, even when management is blocked.
    expect(screen.getByRole('menuitem', { name: /View/ })).toBeInTheDocument();
  });

  it('hides the deactivate action on the current user’s own row', async () => {
    render(
      <UsersTable
        rows={[makeRow({ id: 'current-user', active: true })]}
        currentUser={makeCurrentUser({ id: 'current-user' })}
        permissions={ALL_PERMISSIONS}
        {...NOOP_ACTIONS}
      />,
    );

    await openRowMenu();

    expect(screen.queryByRole('menuitem', { name: /Deactivate/ })).not.toBeInTheDocument();
  });

  it('does not render write actions when the caller lacks permission', async () => {
    render(
      <UsersTable
        rows={[makeRow({ id: 'row-1' })]}
        currentUser={makeCurrentUser({})}
        permissions={{
          canUpdate: false,
          canChangeStatus: false,
          canChangeRole: false,
          canResetPassword: false,
          canChangePasswordRequirement: false,
          canDelete: false,
        }}
        {...NOOP_ACTIONS}
      />,
    );

    await openRowMenu();

    expect(screen.queryByRole('menuitem', { name: /Edit/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Deactivate/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Change role/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Reset password/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Delete/ })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /View/ })).toBeInTheDocument();
  });

  it('shows the delete action for ADMIN but never on the current user’s own row', async () => {
    render(
      <UsersTable
        rows={[makeRow({ id: 'row-1' })]}
        currentUser={makeCurrentUser({})}
        permissions={ALL_PERMISSIONS}
        {...NOOP_ACTIONS}
      />,
    );

    await openRowMenu();
    expect(screen.getByRole('menuitem', { name: /Delete/ })).toBeInTheDocument();
  });

  it('hides the delete action on the current user’s own row even for ADMIN', async () => {
    render(
      <UsersTable
        rows={[makeRow({ id: 'current-user' })]}
        currentUser={makeCurrentUser({ id: 'current-user' })}
        permissions={ALL_PERMISSIONS}
        {...NOOP_ACTIONS}
      />,
    );

    await openRowMenu();
    expect(screen.queryByRole('menuitem', { name: /Delete/ })).not.toBeInTheDocument();
  });
});
