import { useTranslation } from 'react-i18next';

import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { useChangeApiKeyStatus } from '@/features/api-keys/api-keys.hooks';
import type { ApiKey } from '@/features/api-keys/api-keys.types';
import { getApiErrorMessage } from '@/lib/api/api-response';

interface ApiKeyStatusDialogProps {
  open: boolean;
  apiKey: ApiKey;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ApiKeyStatusDialog({
  open,
  apiKey,
  onOpenChange,
  onSuccess,
}: ApiKeyStatusDialogProps) {
  const { t } = useTranslation();
  const mutation = useChangeApiKeyStatus(apiKey.id);

  const nextActive = !apiKey.active;

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
      title={t(nextActive ? 'apiKeys.status.activateTitle' : 'apiKeys.status.deactivateTitle')}
      description={t(
        nextActive ? 'apiKeys.status.activateDescription' : 'apiKeys.status.deactivateDescription',
        { name: apiKey.name },
      )}
      confirmLabel={t(nextActive ? 'apiKeys.actions.activate' : 'apiKeys.actions.deactivate')}
      destructive={!nextActive}
      isLoading={mutation.isPending}
      errorMessage={
        mutation.isError ? getApiErrorMessage(mutation.error, t('apiKeys.error')) : null
      }
      onConfirm={handleConfirm}
    />
  );
}
