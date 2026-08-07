import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { DeleteConfirmationDialog } from '@/components/shared/delete-confirmation-dialog';
import { useDeleteUser } from '@/features/users/users.hooks';
import type { UserListItem } from '@/features/users/users.types';
import { getDeleteErrorMessage } from '@/lib/api/delete-error';

interface UserDeleteDialogProps {
  open: boolean;
  user: UserListItem;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UserDeleteDialog({ open, user, onOpenChange, onSuccess }: UserDeleteDialogProps) {
  const { t } = useTranslation();
  const mutation = useDeleteUser(user.id);
  // `mutation.isPending` only updates on the next render — a synchronous ref
  // guards against a second click firing before that re-render happens.
  const isSubmittingRef = useRef(false);

  async function handleConfirm() {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      await mutation.mutateAsync();
      onSuccess();
    } catch {
      // Surfaced via mutation.isError/mutation.error below — nothing else to do here.
    } finally {
      isSubmittingRef.current = false;
    }
  }

  return (
    <DeleteConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('users.delete.title')}
      entityName={user.name}
      isLoading={mutation.isPending}
      errorMessage={
        mutation.isError ? getDeleteErrorMessage(mutation.error, t('users.error')) : null
      }
      onConfirm={handleConfirm}
    />
  );
}
