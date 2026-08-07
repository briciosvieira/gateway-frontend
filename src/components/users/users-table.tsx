import {
  KeyRound,
  MoreHorizontal,
  Pencil,
  Power,
  ShieldQuestion,
  Trash2,
  UserCog,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { RoleBadge } from '@/components/shared/role-badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AuthenticatedUser } from '@/features/auth/auth.types';
import {
  canDeactivate,
  canDeleteUser,
  canManageTargetRole,
} from '@/features/users/users.permissions';
import type { UserListItem } from '@/features/users/users.types';
import { cn } from '@/lib/utils';

interface UsersTableActions {
  onView: (user: UserListItem) => void;
  onEdit: (user: UserListItem) => void;
  onToggleStatus: (user: UserListItem) => void;
  onChangeRole: (user: UserListItem) => void;
  onChangePasswordRequirement: (user: UserListItem) => void;
  onResetPassword: (user: UserListItem) => void;
  onDelete: (user: UserListItem) => void;
}

interface UsersTablePermissions {
  canUpdate: boolean;
  canChangeStatus: boolean;
  canChangeRole: boolean;
  canResetPassword: boolean;
  canChangePasswordRequirement: boolean;
  canDelete: boolean;
}

interface UsersTableProps extends UsersTableActions {
  rows: UserListItem[];
  currentUser: AuthenticatedUser;
  permissions: UsersTablePermissions;
}

export function UsersTable({
  rows,
  currentUser,
  permissions,
  onView,
  onEdit,
  onToggleStatus,
  onChangeRole,
  onChangePasswordRequirement,
  onResetPassword,
  onDelete,
}: UsersTableProps) {
  const { t, i18n } = useTranslation();

  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  function formatDate(value: string | null) {
    return value ? dateFormatter.format(new Date(value)) : t('users.table.never');
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <caption className="sr-only">{t('users.title')}</caption>
        <thead className="bg-surface text-left text-xs font-medium tracking-wide text-muted uppercase">
          <tr>
            <th scope="col" className="px-4 py-2">
              {t('users.table.name')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('users.table.username')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('users.table.email')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('users.table.role')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('users.table.status')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('users.table.firstLogin')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('users.table.lastLogin')}
            </th>
            <th scope="col" className="px-4 py-2">
              {t('users.table.createdAt')}
            </th>
            <th scope="col" className="px-4 py-2 text-right">
              {t('users.table.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => {
            const isSelf = row.id === currentUser.id;
            const canManageTarget = canManageTargetRole(currentUser.role.code, row.role.code);
            const canToggleThisStatus =
              permissions.canChangeStatus &&
              canManageTarget &&
              (row.active ? canDeactivate(currentUser, row) : true);

            return (
              <tr key={row.id} className="hover:bg-surface/60">
                <td className="px-4 py-2 font-medium text-foreground">{row.name}</td>
                <td className="px-4 py-2 font-mono text-xs">{row.username}</td>
                <td className="px-4 py-2">{row.email}</td>
                <td className="px-4 py-2">
                  <RoleBadge code={row.role.code} />
                </td>
                <td className="px-4 py-2">
                  <StatusBadge active={row.active} />
                </td>
                <td className="px-4 py-2">
                  <span
                    className={cn(
                      'text-xs font-medium',
                      row.firstLogin ? 'text-muted' : 'text-primary',
                    )}
                  >
                    {t(row.firstLogin ? 'users.table.pending' : 'users.table.completed')}
                  </span>
                </td>
                <td className="px-4 py-2">{formatDate(row.lastLoginAt)}</td>
                <td className="px-4 py-2">{formatDate(row.createdAt)}</td>
                <td className="px-4 py-2 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t('users.table.actions')}
                      >
                        <MoreHorizontal className="size-4" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => onView(row)}>
                        {t('users.actions.view')}
                      </DropdownMenuItem>

                      {permissions.canUpdate && canManageTarget && (
                        <DropdownMenuItem onSelect={() => onEdit(row)}>
                          <Pencil className="size-4" aria-hidden="true" />
                          {t('users.actions.edit')}
                        </DropdownMenuItem>
                      )}

                      {canToggleThisStatus && (
                        <DropdownMenuItem onSelect={() => onToggleStatus(row)}>
                          <Power className="size-4" aria-hidden="true" />
                          {t(row.active ? 'users.actions.deactivate' : 'users.actions.activate')}
                        </DropdownMenuItem>
                      )}

                      {permissions.canChangeRole &&
                        canManageTarget &&
                        !(isSelf && row.role.code === 'ADMIN') && (
                          <DropdownMenuItem onSelect={() => onChangeRole(row)}>
                            <UserCog className="size-4" aria-hidden="true" />
                            {t('users.actions.changeRole')}
                          </DropdownMenuItem>
                        )}

                      {permissions.canChangePasswordRequirement && canManageTarget && (
                        <DropdownMenuItem onSelect={() => onChangePasswordRequirement(row)}>
                          <ShieldQuestion className="size-4" aria-hidden="true" />
                          {t('users.actions.passwordRequirement')}
                        </DropdownMenuItem>
                      )}

                      {permissions.canResetPassword && canManageTarget && (
                        <DropdownMenuItem onSelect={() => onResetPassword(row)}>
                          <KeyRound className="size-4" aria-hidden="true" />
                          {t('users.actions.resetPassword')}
                        </DropdownMenuItem>
                      )}

                      {permissions.canDelete && canDeleteUser(currentUser, row) && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={() => onDelete(row)}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                          {t('common.actions.delete')}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
