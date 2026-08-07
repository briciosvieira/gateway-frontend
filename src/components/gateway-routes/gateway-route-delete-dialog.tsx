import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { DeleteConfirmationDialog } from '@/components/shared/delete-confirmation-dialog';
import { useDeleteGatewayRoute } from '@/features/gateway-routes/gateway-routes.hooks';
import type { GatewayRoute } from '@/features/gateway-routes/gateway-routes.types';
import { getDeleteErrorMessage } from '@/lib/api/delete-error';

interface GatewayRouteDeleteDialogProps {
  open: boolean;
  route: GatewayRoute;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function GatewayRouteDeleteDialog({
  open,
  route,
  onOpenChange,
  onSuccess,
}: GatewayRouteDeleteDialogProps) {
  const { t } = useTranslation();
  const mutation = useDeleteGatewayRoute(route.id);
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
      title={t('gatewayRoutes.delete.title')}
      entityName={route.name}
      dependencyWarning={t('gatewayRoutes.delete.dependenciesWarning')}
      isLoading={mutation.isPending}
      errorMessage={
        mutation.isError ? getDeleteErrorMessage(mutation.error, t('gatewayRoutes.error')) : null
      }
      onConfirm={handleConfirm}
    />
  );
}
