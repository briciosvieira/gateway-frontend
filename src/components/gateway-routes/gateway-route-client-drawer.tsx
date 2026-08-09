import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GatewayRouteDeleteDialog } from '@/components/gateway-routes/gateway-route-delete-dialog';
import { GatewayRouteDetailsDrawer } from '@/components/gateway-routes/gateway-route-details-drawer';
import { GatewayRouteFilters } from '@/components/gateway-routes/gateway-route-filters';
import {
  CreateGatewayRouteForm,
  EditGatewayRouteForm,
} from '@/components/gateway-routes/gateway-route-form';
import { GatewayRouteStatusDialog } from '@/components/gateway-routes/gateway-route-status-dialog';
import { GatewayRoutesTable } from '@/components/gateway-routes/gateway-routes-table';
import { ClientResourceDrawerHeader } from '@/components/shared/client-resource-drawer-header';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { TableEmptyState } from '@/components/shared/table-empty-state';
import { TableErrorState } from '@/components/shared/table-error-state';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useAuth } from '@/features/auth/use-auth';
import type { ClientRef } from '@/features/clients/clients.types';
import {
  DEFAULT_GATEWAY_ROUTES_FILTERS,
  GATEWAY_ROUTES_PAGE_SIZE,
} from '@/features/gateway-routes/gateway-routes.constants';
import { useGatewayRoutes } from '@/features/gateway-routes/gateway-routes.hooks';
import type {
  FindGatewayRoutesParams,
  GatewayRoute,
  GatewayRoutesFilterState,
} from '@/features/gateway-routes/gateway-routes.types';
import { isApiError } from '@/lib/api/api-error';
import { getApiErrorMessage } from '@/lib/api/api-response';

type FormDialogState = { mode: 'create' } | { mode: 'edit'; route: GatewayRoute } | null;

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

const FEEDBACK_TIMEOUT_MS = 4000;

function toFindGatewayRoutesParams(
  clientId: string,
  filters: GatewayRoutesFilterState,
): FindGatewayRoutesParams {
  return {
    page: filters.page,
    limit: GATEWAY_ROUTES_PAGE_SIZE,
    clientId,
    search: filters.search || undefined,
    method: filters.method === 'all' ? undefined : filters.method,
    active: filters.status === 'all' ? undefined : filters.status === 'active',
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };
}

interface GatewayRouteClientDrawerProps {
  open: boolean;
  client: ClientRef | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Per-client Gateway Routes view — opened from the main "clients" list.
 * Queries `GET /gateway-routes?clientId=<id>` (real, paginated, filtered),
 * never the full unscoped list. Reuses every existing Gateway Routes
 * component/hook/dialog unchanged; only the client is fixed instead of
 * user-selectable.
 */
export function GatewayRouteClientDrawer({
  open,
  client,
  onOpenChange,
}: GatewayRouteClientDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {client && <GatewayRouteClientDrawerContent key={client.id} client={client} />}
    </Sheet>
  );
}

function GatewayRouteClientDrawerContent({ client }: { client: ClientRef }) {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const [filters, setFilters] = useState<GatewayRoutesFilterState>(DEFAULT_GATEWAY_ROUTES_FILTERS);
  const [formDialog, setFormDialog] = useState<FormDialogState>(null);
  const [statusRoute, setStatusRoute] = useState<GatewayRoute | null>(null);
  const [deleteRoute, setDeleteRoute] = useState<GatewayRoute | null>(null);
  const [detailsRoute, setDetailsRoute] = useState<GatewayRoute | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  function showFeedback(type: FeedbackState['type'], message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), FEEDBACK_TIMEOUT_MS);
  }

  function updateFilters(patch: Partial<GatewayRoutesFilterState>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function clearFilters() {
    setFilters(DEFAULT_GATEWAY_ROUTES_FILTERS);
  }

  const params = useMemo(() => toFindGatewayRoutesParams(client.id, filters), [client.id, filters]);
  const routesQuery = useGatewayRoutes(params);
  const rows = routesQuery.data?.items ?? [];
  const pagination = routesQuery.data?.pagination;

  return (
    <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-4xl">
      <div className="shrink-0 p-6 pb-4">
        <ClientResourceDrawerHeader
          title={t('gatewayRoutes.clientDrawer.title', { name: client.name })}
          client={client}
        />
      </div>

      {/* Only this pane scrolls — header stays fixed above it, so the last
          row/pagination is always reachable no matter how many Gateway
          Routes the client has. */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6 pt-0">
        {feedback && (
          <p
            role="status"
            className={
              feedback.type === 'success'
                ? 'rounded-md bg-primary/10 px-4 py-2 text-sm text-primary'
                : 'rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive'
            }
          >
            {feedback.message}
          </p>
        )}

        {hasPermission('gatewayRoutes.create') && (
          <div className="flex justify-end">
            <Button type="button" onClick={() => setFormDialog({ mode: 'create' })}>
              <Plus className="size-4" aria-hidden="true" />
              {t('gatewayRoutes.new')}
            </Button>
          </div>
        )}

        <GatewayRouteFilters
          value={filters}
          onChange={updateFilters}
          onClear={clearFilters}
          showClientFilter={false}
        />

        <Card className="overflow-hidden p-4">
          {routesQuery.isError ? (
            <TableErrorState
              message={getApiErrorMessage(routesQuery.error, t('gatewayRoutes.error'))}
              requestId={isApiError(routesQuery.error) ? routesQuery.error.requestId : undefined}
              onRetry={() => void routesQuery.refetch()}
            />
          ) : routesQuery.isLoading ? (
            <TableSkeleton columns={10} />
          ) : rows.length === 0 ? (
            <TableEmptyState message={t('gatewayRoutes.clientDrawer.empty')} />
          ) : (
            <GatewayRoutesTable
              rows={rows}
              permissions={{
                canUpdate: hasPermission('gatewayRoutes.update'),
                canChangeStatus: hasPermission('gatewayRoutes.status'),
                canDelete: hasPermission('gatewayRoutes.delete'),
              }}
              onView={setDetailsRoute}
              onEdit={(route) => setFormDialog({ mode: 'edit', route })}
              onToggleStatus={setStatusRoute}
              onDelete={setDeleteRoute}
            />
          )}
        </Card>

        {pagination && (
          <DataTablePagination
            page={pagination.page}
            pageSize={pagination.limit}
            total={pagination.total}
            onPageChange={(page) => updateFilters({ page })}
          />
        )}
      </div>

      {formDialog?.mode === 'create' && (
        <CreateGatewayRouteForm
          open
          lockedClient={client}
          onOpenChange={(open) => !open && setFormDialog(null)}
          onSuccess={(route) => {
            setFormDialog(null);
            showFeedback('success', t('gatewayRoutes.success.created', { name: route.name }));
            setDetailsRoute(route);
          }}
        />
      )}

      {formDialog?.mode === 'edit' && (
        <EditGatewayRouteForm
          open
          onOpenChange={(open) => !open && setFormDialog(null)}
          route={formDialog.route}
          onSuccess={(route) => {
            setFormDialog(null);
            showFeedback('success', t('gatewayRoutes.success.updated', { name: route.name }));
          }}
        />
      )}

      {statusRoute && (
        <GatewayRouteStatusDialog
          open
          route={statusRoute}
          onOpenChange={(open) => !open && setStatusRoute(null)}
          onSuccess={() => {
            setStatusRoute(null);
            showFeedback('success', t('gatewayRoutes.success.statusChanged'));
          }}
        />
      )}

      {deleteRoute && (
        <GatewayRouteDeleteDialog
          open
          route={deleteRoute}
          onOpenChange={(open) => !open && setDeleteRoute(null)}
          onSuccess={() => {
            setDeleteRoute(null);
            showFeedback('success', t('gatewayRoutes.delete.success'));
          }}
        />
      )}

      <GatewayRouteDetailsDrawer
        open={detailsRoute !== null}
        route={detailsRoute}
        onOpenChange={(open) => !open && setDetailsRoute(null)}
      />
    </SheetContent>
  );
}
