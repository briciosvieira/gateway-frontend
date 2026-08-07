import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { SensitiveBadge } from '@/components/route-headers/sensitive-badge';
import { DeleteConfirmationDialog } from '@/components/shared/delete-confirmation-dialog';
import {
  useDeleteRouteHeader,
  useRouteHeaderGatewayRoute,
} from '@/features/route-headers/route-headers.hooks';
import type { RouteHeader } from '@/features/route-headers/route-headers.types';
import { getDeleteErrorMessage } from '@/lib/api/delete-error';

interface RouteHeaderDeleteDialogProps {
  open: boolean;
  routeHeader: RouteHeader;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RouteHeaderDeleteDialog({
  open,
  routeHeader,
  onOpenChange,
  onSuccess,
}: RouteHeaderDeleteDialogProps) {
  const { t } = useTranslation();
  const mutation = useDeleteRouteHeader(routeHeader.id);
  const routeContextQuery = useRouteHeaderGatewayRoute(routeHeader.gatewayRouteId, open);
  const isSubmittingRef = useRef(false);

  async function handleConfirm() {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      await mutation.mutateAsync();
      onSuccess();
    } catch {
      // Surfaced by the dialog state.
    } finally {
      isSubmittingRef.current = false;
    }
  }

  const detailLine = routeContextQuery.data
    ? `${t('routeHeaders.delete.routeLabel', { route: routeContextQuery.data.name })} - ${
        routeContextQuery.data.client.name
      }`
    : undefined;

  return (
    <div>
      <DeleteConfirmationDialog
        open={open}
        onOpenChange={onOpenChange}
        title={t('routeHeaders.delete.title')}
        entityName={routeHeader.name}
        dependencyWarning={detailLine}
        isLoading={mutation.isPending}
        errorMessage={
          mutation.isError ? getDeleteErrorMessage(mutation.error, t('routeHeaders.error')) : null
        }
        onConfirm={handleConfirm}
      />

      <div className="sr-only" aria-hidden="true">
        <SensitiveBadge sensitive={routeHeader.sensitive} />
      </div>
    </div>
  );
}
