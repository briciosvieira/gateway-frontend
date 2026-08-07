import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { PageHeader } from '@/components/shared/page-header';
import { TableEmptyState } from '@/components/shared/table-empty-state';
import { TableErrorState } from '@/components/shared/table-error-state';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PasswordRequirementDialog } from '@/components/users/password-requirement-dialog';
import { ResetPasswordDialog } from '@/components/users/reset-password-dialog';
import { TemporaryPasswordDialog } from '@/components/users/temporary-password-dialog';
import { UserDeleteDialog } from '@/components/users/user-delete-dialog';
import { UserDetailsDrawer } from '@/components/users/user-details-drawer';
import { UserFilters } from '@/components/users/user-filters';
import { CreateUserForm, EditUserForm } from '@/components/users/user-form';
import { UserRoleDialog } from '@/components/users/user-role-dialog';
import { UserStatusDialog } from '@/components/users/user-status-dialog';
import { UsersTable } from '@/components/users/users-table';
import { useAuth } from '@/features/auth/use-auth';
import { DEFAULT_USERS_FILTERS, USERS_PAGE_SIZE } from '@/features/users/users.constants';
import { useAssignableRoles, useUsers } from '@/features/users/users.hooks';
import type { ResetPasswordResult, UserListItem } from '@/features/users/users.types';
import {
  applyUsersFilters,
  paginateItems,
  parseUsersFiltersFromSearchParams,
  usersFiltersToSearchParams,
} from '@/features/users/users.view-utils';
import { isApiError } from '@/lib/api/api-error';
import { getApiErrorMessage } from '@/lib/api/api-response';

type FormDialogState = { mode: 'create' } | { mode: 'edit'; user: UserListItem } | null;

interface TemporaryPasswordState {
  password: string;
  mustChangeOnNextLogin: boolean;
}

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

const FEEDBACK_TIMEOUT_MS = 4000;

export function UsersPage() {
  const { t } = useTranslation();
  const { user: currentUser, hasPermission } = useAuth();

  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseUsersFiltersFromSearchParams(searchParams), [searchParams]);

  const usersQuery = useUsers();
  const rolesQuery = useAssignableRoles();

  const [formDialog, setFormDialog] = useState<FormDialogState>(null);
  const [statusUser, setStatusUser] = useState<UserListItem | null>(null);
  const [roleUser, setRoleUser] = useState<UserListItem | null>(null);
  const [passwordRequirementUser, setPasswordRequirementUser] = useState<UserListItem | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserListItem | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserListItem | null>(null);
  const [detailsUser, setDetailsUser] = useState<UserListItem | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<TemporaryPasswordState | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  function showFeedback(type: FeedbackState['type'], message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), FEEDBACK_TIMEOUT_MS);
  }

  function updateFilters(patch: Partial<typeof filters>) {
    setSearchParams(usersFiltersToSearchParams({ ...filters, ...patch }));
  }

  function clearFilters() {
    setSearchParams(usersFiltersToSearchParams(DEFAULT_USERS_FILTERS));
  }

  const filteredUsers = useMemo(
    () => applyUsersFilters(usersQuery.data ?? [], filters),
    [usersQuery.data, filters],
  );

  const pageRows = useMemo(
    () => paginateItems(filteredUsers, filters.page, USERS_PAGE_SIZE),
    [filteredUsers, filters.page],
  );

  if (!currentUser) return null;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('users.title')}
        description={t('users.description')}
        actions={
          hasPermission('users.create') && (
            <Button type="button" onClick={() => setFormDialog({ mode: 'create' })}>
              <Plus className="size-4" aria-hidden="true" />
              {t('users.new')}
            </Button>
          )
        }
      />

      {feedback && (
        <p
          role="status"
          className={
            feedback.type === 'success'
              ? 'rounded-md bg-primary/10 px-4 py-2 text-sm text-primary'
              : 'rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive'
          }
        >
          {feedback.message}
        </p>
      )}

      <UserFilters value={filters} onChange={updateFilters} onClear={clearFilters} />

      <Card className="overflow-hidden p-4">
        {usersQuery.isError ? (
          <TableErrorState
            message={getApiErrorMessage(usersQuery.error, t('users.error'))}
            requestId={isApiError(usersQuery.error) ? usersQuery.error.requestId : undefined}
            onRetry={() => void usersQuery.refetch()}
          />
        ) : usersQuery.isLoading ? (
          <TableSkeleton />
        ) : pageRows.length === 0 ? (
          <TableEmptyState message={t('users.empty')} />
        ) : (
          <UsersTable
            rows={pageRows}
            currentUser={currentUser}
            permissions={{
              canUpdate: hasPermission('users.update'),
              canChangeStatus: hasPermission('users.status'),
              canChangeRole: hasPermission('users.role'),
              canResetPassword: hasPermission('users.resetPassword'),
              canChangePasswordRequirement: hasPermission('users.passwordRequirement'),
              canDelete: hasPermission('users.delete'),
            }}
            onView={setDetailsUser}
            onEdit={(user) => setFormDialog({ mode: 'edit', user })}
            onToggleStatus={setStatusUser}
            onChangeRole={setRoleUser}
            onChangePasswordRequirement={setPasswordRequirementUser}
            onResetPassword={setResetPasswordUser}
            onDelete={setDeleteUser}
          />
        )}
      </Card>

      <DataTablePagination
        page={filters.page}
        pageSize={USERS_PAGE_SIZE}
        total={filteredUsers.length}
        onPageChange={(page) => updateFilters({ page })}
      />

      {formDialog?.mode === 'create' && (
        <CreateUserForm
          open
          onOpenChange={(open) => !open && setFormDialog(null)}
          roles={rolesQuery.data ?? []}
          onSuccess={(result) => {
            setFormDialog(null);
            showFeedback('success', t('users.success.created'));
            setTemporaryPassword({
              password: result.temporaryPassword,
              mustChangeOnNextLogin: result.passwordMustBeChanged,
            });
          }}
        />
      )}

      {formDialog?.mode === 'edit' && (
        <EditUserForm
          open
          onOpenChange={(open) => !open && setFormDialog(null)}
          user={formDialog.user}
          onSuccess={() => {
            setFormDialog(null);
            showFeedback('success', t('users.success.updated'));
          }}
        />
      )}

      {statusUser && (
        <UserStatusDialog
          open
          user={statusUser}
          onOpenChange={(open) => !open && setStatusUser(null)}
          onSuccess={() => {
            setStatusUser(null);
            showFeedback('success', t('users.success.statusChanged'));
          }}
        />
      )}

      {roleUser && (
        <UserRoleDialog
          open
          user={roleUser}
          roles={rolesQuery.data ?? []}
          onOpenChange={(open) => !open && setRoleUser(null)}
          onSuccess={() => {
            setRoleUser(null);
            showFeedback('success', t('users.success.roleChanged'));
          }}
        />
      )}

      {passwordRequirementUser && (
        <PasswordRequirementDialog
          open
          user={passwordRequirementUser}
          onOpenChange={(open) => !open && setPasswordRequirementUser(null)}
          onSuccess={() => {
            setPasswordRequirementUser(null);
            showFeedback('success', t('users.success.passwordRequirementChanged'));
          }}
        />
      )}

      {resetPasswordUser && (
        <ResetPasswordDialog
          open
          user={resetPasswordUser}
          onOpenChange={(open) => !open && setResetPasswordUser(null)}
          onSuccess={(result: ResetPasswordResult) => {
            setResetPasswordUser(null);
            showFeedback('success', t('users.success.passwordReset'));
            setTemporaryPassword({
              password: result.temporaryPassword,
              mustChangeOnNextLogin: result.passwordMustBeChanged,
            });
          }}
        />
      )}

      {deleteUser && (
        <UserDeleteDialog
          open
          user={deleteUser}
          onOpenChange={(open) => !open && setDeleteUser(null)}
          onSuccess={() => {
            setDeleteUser(null);
            showFeedback('success', t('users.delete.success'));
          }}
        />
      )}

      <UserDetailsDrawer
        open={detailsUser !== null}
        user={detailsUser}
        onOpenChange={(open) => !open && setDetailsUser(null)}
      />

      {temporaryPassword && (
        <TemporaryPasswordDialog
          open
          password={temporaryPassword.password}
          mustChangeOnNextLogin={temporaryPassword.mustChangeOnNextLogin}
          onClose={() => setTemporaryPassword(null)}
        />
      )}
    </div>
  );
}
