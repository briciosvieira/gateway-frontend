import { useTranslation } from 'react-i18next';

import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { useChangeGatewayRouteStatus } from '@/features/gateway-routes/gateway-routes.hooks';
import type { GatewayRoute } from '@/features/gateway-routes/gateway-routes.types';
import { getApiErrorMessage } from '@/lib/api/api-response';

interface GatewayRouteStatusDialogProps {
  open: boolean;
  route: GatewayRoute;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function GatewayRouteStatusDialog({
  open,
  route,
  onOpenChange,
  onSuccess,
}: GatewayRouteStatusDialogProps) {
  const { t } = useTranslation();
  const mutation = useChangeGatewayRouteStatus(route.id);

  const nextActive = !route.active;

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
        nextActive ? 'gatewayRoutes.status.activateTitle' : 'gatewayRoutes.status.deactivateTitle',
      )}
      description={t(
        nextActive
          ? 'gatewayRoutes.status.activateDescription'
          : 'gatewayRoutes.status.deactivateDescription',
        { name: route.name },
      )}
      confirmLabel={t(
        nextActive ? 'gatewayRoutes.actions.activate' : 'gatewayRoutes.actions.deactivate',
      )}
      destructive={!nextActive}
      isLoading={mutation.isPending}
      errorMessage={
        mutation.isError ? getApiErrorMessage(mutation.error, t('gatewayRoutes.error')) : null
      }
      onConfirm={handleConfirm}
    />
  );
}
