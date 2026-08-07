import { useTranslation } from 'react-i18next';

import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { useChangePasswordRequirement } from '@/features/users/users.hooks';
import type { UserListItem } from '@/features/users/users.types';
import { getApiErrorMessage } from '@/lib/api/api-response';

interface PasswordRequirementDialogProps {
  open: boolean;
  user: UserListItem;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PasswordRequirementDialog({
  open,
  user,
  onOpenChange,
  onSuccess,
}: PasswordRequirementDialogProps) {
  const { t } = useTranslation();
  const mutation = useChangePasswordRequirement(user.id);

  const nextRequirePasswordChange = !user.firstLogin;

  async function handleConfirm() {
    try {
      await mutation.mutateAsync({ requirePasswordChange: nextRequirePasswordChange });
      onSuccess();
    } catch {
      // Surfaced via mutation.isError/mutation.error below — nothing else to do here.
    }
  }

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('users.actions.passwordRequirement')}
      description={t(
        nextRequirePasswordChange
          ? 'users.passwordRequirement.enableDescription'
          : 'users.passwordRequirement.disableDescription',
        { name: user.name },
      )}
      confirmLabel={t(
        nextRequirePasswordChange
          ? 'users.passwordRequirement.enable'
          : 'users.passwordRequirement.disable',
      )}
      isLoading={mutation.isPending}
      errorMessage={mutation.isError ? getApiErrorMessage(mutation.error, t('users.error')) : null}
      onConfirm={handleConfirm}
    />
  );
}
