import { useTranslation } from 'react-i18next';

import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { useChangeRouteHeaderStatus } from '@/features/route-headers/route-headers.hooks';
import type { RouteHeader } from '@/features/route-headers/route-headers.types';
import { getApiErrorMessage } from '@/lib/api/api-response';

interface RouteHeaderStatusDialogProps {
  open: boolean;
  routeHeader: RouteHeader;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RouteHeaderStatusDialog({
  open,
  routeHeader,
  onOpenChange,
  onSuccess,
}: RouteHeaderStatusDialogProps) {
  const { t } = useTranslation();
  const mutation = useChangeRouteHeaderStatus(routeHeader.id);

  const nextActive = !routeHeader.active;

  async function handleConfirm() {
    try {
      await mutation.mutateAsync({ active: nextActive });
      onSuccess();
    } catch {
      // Surfaced by the dialog state.
    }
  }

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t(
        nextActive ? 'routeHeaders.status.activateTitle' : 'routeHeaders.status.deactivateTitle',
      )}
      description={t(
        nextActive
          ? 'routeHeaders.status.activateDescription'
          : 'routeHeaders.status.deactivateDescription',
        { name: routeHeader.name },
      )}
      confirmLabel={t(
        nextActive ? 'routeHeaders.actions.activate' : 'routeHeaders.actions.deactivate',
      )}
      destructive={!nextActive}
      isLoading={mutation.isPending}
      errorMessage={
        mutation.isError ? getApiErrorMessage(mutation.error, t('routeHeaders.error')) : null
      }
      onConfirm={handleConfirm}
    />
  );
}
