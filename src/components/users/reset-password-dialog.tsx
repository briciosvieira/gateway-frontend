import { useTranslation } from 'react-i18next';

import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { useResetUserPassword } from '@/features/users/users.hooks';
import type { ResetPasswordResult, UserListItem } from '@/features/users/users.types';
import { getApiErrorMessage } from '@/lib/api/api-response';

interface ResetPasswordDialogProps {
  open: boolean;
  user: UserListItem;
  onOpenChange: (open: boolean) => void;
  onSuccess: (result: ResetPasswordResult) => void;
}

export function ResetPasswordDialog({
  open,
  user,
  onOpenChange,
  onSuccess,
}: ResetPasswordDialogProps) {
  const { t } = useTranslation();
  const mutation = useResetUserPassword(user.id);

  async function handleConfirm() {
    try {
      const result = await mutation.mutateAsync();
      onSuccess(result);
    } catch {
      // Surfaced via mutation.isError/mutation.error below — nothing else to do here.
    }
  }

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('users.actions.resetPassword')}
      description={t('users.resetPassword.description', { name: user.name })}
      confirmLabel={t('users.actions.resetPassword')}
      isLoading={mutation.isPending}
      errorMessage={mutation.isError ? getApiErrorMessage(mutation.error, t('users.error')) : null}
      onConfirm={handleConfirm}
    />
  );
}
