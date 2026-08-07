import { useTranslation } from 'react-i18next';

import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { useRevokeApiKey } from '@/features/api-keys/api-keys.hooks';
import type { ApiKey } from '@/features/api-keys/api-keys.types';
import { getApiErrorMessage } from '@/lib/api/api-response';

interface ApiKeyRevokeDialogProps {
  open: boolean;
  apiKey: ApiKey;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ApiKeyRevokeDialog({
  open,
  apiKey,
  onOpenChange,
  onSuccess,
}: ApiKeyRevokeDialogProps) {
  const { t } = useTranslation();
  const mutation = useRevokeApiKey(apiKey.id);

  async function handleConfirm() {
    try {
      await mutation.mutateAsync();
      onSuccess();
    } catch {
      // Surfaced via mutation.isError/mutation.error below — nothing else to do here.
    }
  }

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('apiKeys.actions.revoke')}
      description={t('apiKeys.revoke.description', { name: apiKey.name })}
      confirmLabel={t('apiKeys.actions.revoke')}
      destructive
      isLoading={mutation.isPending}
      errorMessage={
        mutation.isError ? getApiErrorMessage(mutation.error, t('apiKeys.error')) : null
      }
      onConfirm={handleConfirm}
    />
  );
}
