import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { DeleteConfirmationDialog } from '@/components/shared/delete-confirmation-dialog';
import { useDeleteTrustedCa } from '@/features/trusted-cas/trusted-cas.hooks';
import type { TrustedCa } from '@/features/trusted-cas/trusted-cas.types';
import { getDeleteErrorMessage } from '@/lib/api/delete-error';

interface TrustedCaDeleteDialogProps {
  open: boolean;
  trustedCa: TrustedCa;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/** Never shows `certificatePem`/any raw certificate content — only the entity name, per product requirement. */
export function TrustedCaDeleteDialog({
  open,
  trustedCa,
  onOpenChange,
  onSuccess,
}: TrustedCaDeleteDialogProps) {
  const { t } = useTranslation();
  const mutation = useDeleteTrustedCa(trustedCa.id);
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
      title={t('settings.certificates.delete.title')}
      entityName={trustedCa.name}
      dependencyWarning={t('settings.certificates.delete.dependenciesWarning')}
      isLoading={mutation.isPending}
      errorMessage={
        mutation.isError
          ? getDeleteErrorMessage(mutation.error, t('settings.certificates.error'))
          : null
      }
      onConfirm={handleConfirm}
    />
  );
}
