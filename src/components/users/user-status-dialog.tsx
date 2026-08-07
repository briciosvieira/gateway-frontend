import { useTranslation } from 'react-i18next';

import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { useChangeUserStatus } from '@/features/users/users.hooks';
import type { UserListItem } from '@/features/users/users.types';
import { getApiErrorMessage } from '@/lib/api/api-response';

interface UserStatusDialogProps {
  open: boolean;
  user: UserListItem;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UserStatusDialog({ open, user, onOpenChange, onSuccess }: UserStatusDialogProps) {
  const { t } = useTranslation();
  const mutation = useChangeUserStatus(user.id);

  const nextActive = !user.active;

  async function handleConfirm() {
    try {
      await mutation.mutateAsync({ active: nextActive });
      onSuccess();
    } catch {
      // Surfaced via mutation.isError/mutation.error below — nothing else to do here.
    }
  }

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t(nextActive ? 'users.status.activateTitle' : 'users.status.deactivateTitle')}
      description={t(
        nextActive ? 'users.status.activateDescription' : 'users.status.deactivateDescription',
        { name: user.name },
      )}
      confirmLabel={t(nextActive ? 'users.actions.activate' : 'users.actions.deactivate')}
      destructive={!nextActive}
      isLoading={mutation.isPending}
      errorMessage={mutation.isError ? getApiErrorMessage(mutation.error, t('users.error')) : null}
      onConfirm={handleConfirm}
    />
  );
}
