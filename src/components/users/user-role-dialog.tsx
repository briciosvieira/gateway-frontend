import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { RoleBadge } from '@/components/shared/role-badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useChangeUserRole } from '@/features/users/users.hooks';
import type { AssignableRole, UserListItem } from '@/features/users/users.types';
import { getApiErrorMessage } from '@/lib/api/api-response';

interface UserRoleDialogProps {
  open: boolean;
  user: UserListItem;
  roles: AssignableRole[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UserRoleDialog({
  open,
  user,
  roles,
  onOpenChange,
  onSuccess,
}: UserRoleDialogProps) {
  const { t } = useTranslation();
  const mutation = useChangeUserRole(user.id);
  const [roleId, setRoleId] = useState('');

  const otherRoles = roles.filter((role) => role.code !== user.role.code);

  function handleOpenChange(next: boolean) {
    if (!next) setRoleId('');
    onOpenChange(next);
  }

  async function handleConfirm() {
    if (!roleId) return;
    try {
      await mutation.mutateAsync({ roleId });
      setRoleId('');
      onSuccess();
    } catch {
      // Surfaced via mutation.isError/mutation.error below — nothing else to do here.
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('users.actions.changeRole')}</DialogTitle>
          <DialogDescription>{user.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">{t('users.role.current')}</span>
            <RoleBadge code={user.role.code} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="user-role-select" className="text-sm font-medium">
              {t('users.role.new')}
            </label>
            <select
              id="user-role-select"
              className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={roleId}
              onChange={(event) => setRoleId(event.target.value)}
            >
              <option value="">{t('users.form.rolePlaceholder')}</option>
              {otherRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {t(`auth.roles.${role.code}`)}
                </option>
              ))}
            </select>
          </div>

          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {getApiErrorMessage(mutation.error, t('users.error'))}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={mutation.isPending}
          >
            {t('shared.confirm.cancel')}
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!roleId || mutation.isPending}>
            {mutation.isPending ? t('shared.confirm.loading') : t('shared.confirm.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
