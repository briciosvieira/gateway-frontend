import { useTranslation } from 'react-i18next';

import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { useChangeClientStatus } from '@/features/clients/clients.hooks';
import type { Client } from '@/features/clients/clients.types';
import { getApiErrorMessage } from '@/lib/api/api-response';

interface ClientStatusDialogProps {
  open: boolean;
  client: Client;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ClientStatusDialog({
  open,
  client,
  onOpenChange,
  onSuccess,
}: ClientStatusDialogProps) {
  const { t } = useTranslation();
  const mutation = useChangeClientStatus(client.id);

  const nextActive = !client.active;

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
      title={t(nextActive ? 'clients.status.activateTitle' : 'clients.status.deactivateTitle')}
      description={t(
        nextActive ? 'clients.status.activateDescription' : 'clients.status.deactivateDescription',
        { name: client.name },
      )}
      confirmLabel={t(nextActive ? 'clients.actions.activate' : 'clients.actions.deactivate')}
      destructive={!nextActive}
      isLoading={mutation.isPending}
      errorMessage={
        mutation.isError ? getApiErrorMessage(mutation.error, t('clients.error')) : null
      }
      onConfirm={handleConfirm}
    />
  );
}
