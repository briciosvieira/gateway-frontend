import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { DeleteConfirmationDialog } from '@/components/shared/delete-confirmation-dialog';
import { useDeleteApiKey } from '@/features/api-keys/api-keys.hooks';
import type { ApiKey } from '@/features/api-keys/api-keys.types';
import { getDeleteErrorMessage } from '@/lib/api/delete-error';

interface ApiKeyDeleteDialogProps {
  open: boolean;
  apiKey: ApiKey;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/** Deletes by internal ID only — the key value/hash/prefix is never shown or required here. */
export function ApiKeyDeleteDialog({
  open,
  apiKey,
  onOpenChange,
  onSuccess,
}: ApiKeyDeleteDialogProps) {
  const { t } = useTranslation();
  const mutation = useDeleteApiKey(apiKey.id);
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
      title={t('apiKeys.delete.title')}
      entityName={apiKey.name}
      dependencyWarning={t('apiKeys.delete.irretrievableWarning')}
      isLoading={mutation.isPending}
      errorMessage={
        mutation.isError ? getDeleteErrorMessage(mutation.error, t('apiKeys.error')) : null
      }
      onConfirm={handleConfirm}
    />
  );
}
