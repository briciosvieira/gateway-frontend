import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { DeleteConfirmationDialog } from '@/components/shared/delete-confirmation-dialog';
import { useDeleteAllowedIp } from '@/features/allowed-ips/allowed-ips.hooks';
import type { AllowedIp } from '@/features/allowed-ips/allowed-ips.types';
import { getDeleteErrorMessage } from '@/lib/api/delete-error';

interface AllowedIpDeleteDialogProps {
  open: boolean;
  allowedIp: AllowedIp;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AllowedIpDeleteDialog({
  open,
  allowedIp,
  onOpenChange,
  onSuccess,
}: AllowedIpDeleteDialogProps) {
  const { t } = useTranslation();
  const mutation = useDeleteAllowedIp(allowedIp.id);
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
      title={t('allowedIps.delete.title')}
      entityName={t('allowedIps.delete.entityLabel', {
        client: allowedIp.client.name,
        address: allowedIp.address,
        type: t(`allowedIps.types.${allowedIp.type}`),
      })}
      isLoading={mutation.isPending}
      errorMessage={
        mutation.isError ? getDeleteErrorMessage(mutation.error, t('allowedIps.error')) : null
      }
      onConfirm={handleConfirm}
    />
  );
}
