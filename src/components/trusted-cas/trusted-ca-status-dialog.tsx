import { useTranslation } from 'react-i18next';

import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { useChangeTrustedCaStatus } from '@/features/trusted-cas/trusted-cas.hooks';
import type { TrustedCa } from '@/features/trusted-cas/trusted-cas.types';
import { getApiErrorMessage } from '@/lib/api/api-response';

interface TrustedCaStatusDialogProps {
  open: boolean;
  trustedCa: TrustedCa;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TrustedCaStatusDialog({
  open,
  trustedCa,
  onOpenChange,
  onSuccess,
}: TrustedCaStatusDialogProps) {
  const { t } = useTranslation();
  const mutation = useChangeTrustedCaStatus(trustedCa.id);

  const nextActive = !trustedCa.active;

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
        nextActive
          ? 'settings.certificates.status.activateTitle'
          : 'settings.certificates.status.deactivateTitle',
      )}
      description={t(
        nextActive
          ? 'settings.certificates.status.activateDescription'
          : 'settings.certificates.status.deactivateDescription',
      )}
      confirmLabel={t(
        nextActive
          ? 'settings.certificates.actions.activate'
          : 'settings.certificates.actions.deactivate',
      )}
      destructive={!nextActive}
      isLoading={mutation.isPending}
      errorMessage={
        mutation.isError
          ? getApiErrorMessage(mutation.error, t('settings.certificates.error'))
          : null
      }
      onConfirm={handleConfirm}
    />
  );
}
