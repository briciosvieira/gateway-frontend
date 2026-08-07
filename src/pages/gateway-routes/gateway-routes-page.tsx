import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GatewayRouteClientDrawer } from '@/components/gateway-routes/gateway-route-client-drawer';
import { CreateGatewayRouteForm } from '@/components/gateway-routes/gateway-route-form';
import { ClientResourceListTable } from '@/components/shared/client-resource-list-table';
import { ClientResourceSummaryFilters } from '@/components/shared/client-resource-summary-filters';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { PageHeader } from '@/components/shared/page-header';
import { TableEmptyState } from '@/components/shared/table-empty-state';
import { TableErrorState } from '@/components/shared/table-error-state';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/features/auth/use-auth';
import type { ClientRef } from '@/features/clients/clients.types';
import {
  DEFAULT_GATEWAY_ROUTE_CLIENTS_SUMMARY_FILTERS,
  GATEWAY_ROUTE_CLIENTS_SUMMARY_PAGE_SIZE,
  GATEWAY_ROUTE_CLIENTS_SUMMARY_SORT_OPTIONS,
} from '@/features/gateway-routes/gateway-routes.constants';
import { useGatewayRouteClientsSummary } from '@/features/gateway-routes/gateway-routes.hooks';
import type {
  FindGatewayRouteClientsSummaryParams,
  GatewayRouteClientsSummaryFilterState,
} from '@/features/gateway-routes/gateway-routes.types';
import { isApiError } from '@/lib/api/api-error';
import { getApiErrorMessage } from '@/lib/api/api-response';

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

const FEEDBACK_TIMEOUT_MS = 4000;

function toFindGatewayRouteClientsSummaryParams(
  filters: GatewayRouteClientsSummaryFilterState,
): FindGatewayRouteClientsSummaryParams {
  return {
    page: filters.page,
    limit: GATEWAY_ROUTE_CLIENTS_SUMMARY_PAGE_SIZE,
    search: filters.search || undefined,
    status: filters.status === 'all' ? undefined : filters.status,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };
}

/**
 * Main view is organized by client, sourced from the real, paginated
 * `GET /gateway-routes/clients-summary` — only clients with at least one
 * route ever appear (backend-enforced), and the STATUS column is derived
 * from the aggregate (`active > 0`), never from the client entity's own
 * `active` flag. Selecting a client opens `GatewayRouteClientDrawer`, which
 * queries that client's routes via the existing, already-paginated
 * `GET /gateway-routes?clientId=<id>` — unchanged.
 */
export function GatewayRoutesPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const [filters, setFilters] = useState<GatewayRouteClientsSummaryFilterState>(
    DEFAULT_GATEWAY_ROUTE_CLIENTS_SUMMARY_FILTERS,
  );
  const [selectedClient, setSelectedClient] = useState<ClientRef | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  function showFeedback(type: FeedbackState['type'], message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), FEEDBACK_TIMEOUT_MS);
  }

  function updateFilters(patch: Partial<GatewayRouteClientsSummaryFilterState>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function clearFilters() {
    setFilters(DEFAULT_GATEWAY_ROUTE_CLIENTS_SUMMARY_FILTERS);
  }

  const params = useMemo(() => toFindGatewayRouteClientsSummaryParams(filters), [filters]);
  const summaryQuery = useGatewayRouteClientsSummary(params);
  const rows = summaryQuery.data?.items ?? [];
  const pagination = summaryQuery.data?.pagination;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('gatewayRoutes.title')}
        description={t('gatewayRoutes.description')}
        actions={
          hasPermission('gatewayRoutes.create') && (
            <Button type="button" onClick={() => setShowCreateForm(true)}>
              <Plus className="size-4" aria-hidden="true" />
              {t('gatewayRoutes.new')}
            </Button>
          )
        }
      />

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

      <ClientResourceSummaryFilters
        value={filters}
        onChange={updateFilters}
        onClear={clearFilters}
        defaultValue={DEFAULT_GATEWAY_ROUTE_CLIENTS_SUMMARY_FILTERS}
        sortOptions={GATEWAY_ROUTE_CLIENTS_SUMMARY_SORT_OPTIONS.map((option) => ({
          value: option,
          label: t(`gatewayRoutes.clientsView.sortOptions.${option}`),
        }))}
        labels={{
          searchPlaceholder: t('gatewayRoutes.clientsView.searchPlaceholder'),
          status: t('shared.clientResource.status'),
          allStatuses: t('gatewayRoutes.clientsView.allStatuses'),
          active: t('shared.status.active'),
          inactive: t('shared.status.inactive'),
          sortBy: t('gatewayRoutes.clientsView.sortBy'),
          sortOrder: t('gatewayRoutes.clientsView.sortOrder'),
          ascending: t('gatewayRoutes.clientsView.ascending'),
          descending: t('gatewayRoutes.clientsView.descending'),
          clear: t('gatewayRoutes.clientsView.clear'),
        }}
      />

      <Card className="overflow-hidden p-4">
        {summaryQuery.isError ? (
          <TableErrorState
            message={getApiErrorMessage(summaryQuery.error, t('gatewayRoutes.error'))}
            requestId={isApiError(summaryQuery.error) ? summaryQuery.error.requestId : undefined}
            onRetry={() => void summaryQuery.refetch()}
          />
        ) : summaryQuery.isLoading ? (
          <TableSkeleton columns={4} />
        ) : rows.length === 0 ? (
          <TableEmptyState message={t('gatewayRoutes.empty')} />
        ) : (
          <ClientResourceListTable
            rows={rows}
            getClient={(row) => row.client}
            isActive={(row) => row.active > 0}
            renderCounts={(row) =>
              t('gatewayRoutes.clientsView.counts', {
                total: row.total,
                active: row.active,
                inactive: row.inactive,
              })
            }
            actionLabel={t('gatewayRoutes.clientsView.action')}
            caption={t('gatewayRoutes.title')}
            onOpenClient={setSelectedClient}
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

      {showCreateForm && (
        <CreateGatewayRouteForm
          open
          onOpenChange={setShowCreateForm}
          onSuccess={(route) => {
            setShowCreateForm(false);
            showFeedback('success', t('gatewayRoutes.success.created', { name: route.name }));
          }}
        />
      )}

      <GatewayRouteClientDrawer
        open={selectedClient !== null}
        client={selectedClient}
        onOpenChange={(open) => !open && setSelectedClient(null)}
      />
    </div>
  );
}
