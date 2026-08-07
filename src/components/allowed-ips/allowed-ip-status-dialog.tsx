import { useTranslation } from 'react-i18next';

import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { useChangeAllowedIpStatus } from '@/features/allowed-ips/allowed-ips.hooks';
import type { AllowedIp } from '@/features/allowed-ips/allowed-ips.types';
import { getApiErrorMessage } from '@/lib/api/api-response';

interface AllowedIpStatusDialogProps {
  open: boolean;
  allowedIp: AllowedIp;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AllowedIpStatusDialog({
  open,
  allowedIp,
  onOpenChange,
  onSuccess,
}: AllowedIpStatusDialogProps) {
  const { t } = useTranslation();
  const mutation = useChangeAllowedIpStatus(allowedIp.id);

  const nextActive = !allowedIp.active;

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
      title={t(
        nextActive ? 'allowedIps.status.activateTitle' : 'allowedIps.status.deactivateTitle',
      )}
      description={t(
        nextActive
          ? 'allowedIps.status.activateDescription'
          : 'allowedIps.status.deactivateDescription',
        { address: allowedIp.address },
      )}
      confirmLabel={t(nextActive ? 'allowedIps.actions.activate' : 'allowedIps.actions.deactivate')}
      destructive={!nextActive}
      isLoading={mutation.isPending}
      errorMessage={
        mutation.isError ? getApiErrorMessage(mutation.error, t('allowedIps.error')) : null
      }
      onConfirm={handleConfirm}
    />
  );
}
