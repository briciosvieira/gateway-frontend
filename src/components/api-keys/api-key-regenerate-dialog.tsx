import { useTranslation } from 'react-i18next';

import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { useRegenerateApiKey } from '@/features/api-keys/api-keys.hooks';
import type { ApiKey, RegenerateApiKeyResult } from '@/features/api-keys/api-keys.types';
import { getApiErrorMessage } from '@/lib/api/api-response';

interface ApiKeyRegenerateDialogProps {
  open: boolean;
  apiKey: ApiKey;
  onOpenChange: (open: boolean) => void;
  onSuccess: (result: RegenerateApiKeyResult) => void;
}

export function ApiKeyRegenerateDialog({
  open,
  apiKey,
  onOpenChange,
  onSuccess,
}: ApiKeyRegenerateDialogProps) {
  const { t } = useTranslation();
  const mutation = useRegenerateApiKey(apiKey.id);

  async function handleConfirm() {
    try {
      const result = await mutation.mutateAsync({ revokePrevious: true });
      onSuccess(result);
    } catch {
      // Surfaced via mutation.isError/mutation.error below — nothing else to do here.
    }
  }

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('apiKeys.actions.regenerate')}
      description={t('apiKeys.regenerate.description', { name: apiKey.name })}
      confirmLabel={t('apiKeys.actions.regenerate')}
      destructive
      isLoading={mutation.isPending}
      errorMessage={
        mutation.isError ? getApiErrorMessage(mutation.error, t('apiKeys.error')) : null
      }
      onConfirm={handleConfirm}
    />
  );
}
