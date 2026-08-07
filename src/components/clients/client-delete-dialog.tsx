import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { DeleteConfirmationDialog } from '@/components/shared/delete-confirmation-dialog';
import { useDeleteClient } from '@/features/clients/clients.hooks';
import type { Client } from '@/features/clients/clients.types';
import { getDeleteErrorMessage } from '@/lib/api/delete-error';

interface ClientDeleteDialogProps {
  open: boolean;
  client: Client;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ClientDeleteDialog({
  open,
  client,
  onOpenChange,
  onSuccess,
}: ClientDeleteDialogProps) {
  const { t } = useTranslation();
  const mutation = useDeleteClient(client.id);
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
      title={t('clients.delete.title')}
      entityName={client.name}
      dependencyWarning={t('clients.delete.dependenciesWarning')}
      isLoading={mutation.isPending}
      errorMessage={
        mutation.isError ? getDeleteErrorMessage(mutation.error, t('clients.error')) : null
      }
      onConfirm={handleConfirm}
    />
  );
}
