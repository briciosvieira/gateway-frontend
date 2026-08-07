import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { RouteHeaderDeleteDialog } from '@/components/route-headers/route-header-delete-dialog';
import { RouteHeaderDetailsDrawer } from '@/components/route-headers/route-header-details-drawer';
import { RouteHeaderFilters } from '@/components/route-headers/route-header-filters';
import {
  CreateRouteHeaderForm,
  EditRouteHeaderForm,
} from '@/components/route-headers/route-header-form';
import { RouteHeaderStatusDialog } from '@/components/route-headers/route-header-status-dialog';
import { RouteHeadersTable } from '@/components/route-headers/route-headers-table';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { PageHeader } from '@/components/shared/page-header';
import { TableEmptyState } from '@/components/shared/table-empty-state';
import { TableErrorState } from '@/components/shared/table-error-state';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/features/auth/use-auth';
import {
  DEFAULT_ROUTE_HEADERS_FILTERS,
  ROUTE_HEADERS_PAGE_SIZE,
} from '@/features/route-headers/route-headers.constants';
import {
  useRouteHeaderGatewayRouteContexts,
  useRouteHeaders,
} from '@/features/route-headers/route-headers.hooks';
import type {
  FindRouteHeadersParams,
  RouteHeader,
  RouteHeadersFilterState,
} from '@/features/route-headers/route-headers.types';
import { isApiError } from '@/lib/api/api-error';
import { getApiErrorMessage } from '@/lib/api/api-response';

type FormDialogState = { mode: 'create' } | { mode: 'edit'; routeHeader: RouteHeader } | null;

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

const FEEDBACK_TIMEOUT_MS = 4000;

function toFindRouteHeadersParams(filters: RouteHeadersFilterState): FindRouteHeadersParams {
  return {
    page: filters.page,
    limit: ROUTE_HEADERS_PAGE_SIZE,
    search: filters.search || undefined,
    gatewayRouteId: filters.gatewayRoute?.id,
    sensitive: filters.sensitive === 'all' ? undefined : filters.sensitive === 'sensitive',
    active: filters.status === 'all' ? undefined : filters.status === 'active',
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };
}

export function RouteHeadersPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const [filters, setFilters] = useState<RouteHeadersFilterState>(DEFAULT_ROUTE_HEADERS_FILTERS);
  const [formDialog, setFormDialog] = useState<FormDialogState>(null);
  const [statusRouteHeader, setStatusRouteHeader] = useState<RouteHeader | null>(null);
  const [deleteRouteHeader, setDeleteRouteHeader] = useState<RouteHeader | null>(null);
  const [detailsRouteHeader, setDetailsRouteHeader] = useState<RouteHeader | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  function showFeedback(type: FeedbackState['type'], message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), FEEDBACK_TIMEOUT_MS);
  }

  function updateFilters(patch: Partial<RouteHeadersFilterState>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function clearFilters() {
    setFilters(DEFAULT_ROUTE_HEADERS_FILTERS);
  }

  const params = useMemo(() => toFindRouteHeadersParams(filters), [filters]);
  const routeHeadersQuery = useRouteHeaders(params);
  const rows = routeHeadersQuery.data?.items ?? [];
  const pagination = routeHeadersQuery.data?.pagination;
  const routeContextIds = rows.map((row) => row.gatewayRouteId);
  const routeContextsQuery = useRouteHeaderGatewayRouteContexts(routeContextIds);
  const routeContexts = routeContextsQuery.data ?? {};

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('routeHeaders.title')}
        description={t('routeHeaders.description')}
        actions={
          hasPermission('routeHeaders.create') && (
            <Button type="button" onClick={() => setFormDialog({ mode: 'create' })}>
              <Plus className="size-4" aria-hidden="true" />
              {t('routeHeaders.new')}
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

      <RouteHeaderFilters value={filters} onChange={updateFilters} onClear={clearFilters} />

      <Card className="overflow-hidden p-4">
        {routeHeadersQuery.isError ? (
          <TableErrorState
            message={getApiErrorMessage(routeHeadersQuery.error, t('routeHeaders.error'))}
            requestId={
              isApiError(routeHeadersQuery.error) ? routeHeadersQuery.error.requestId : undefined
            }
            onRetry={() => void routeHeadersQuery.refetch()}
          />
        ) : routeHeadersQuery.isLoading ? (
          <TableSkeleton columns={8} />
        ) : rows.length === 0 ? (
          <TableEmptyState message={t('routeHeaders.empty')} />
        ) : (
          <RouteHeadersTable
            rows={rows}
            routeContexts={routeContexts}
            permissions={{
              canUpdate: hasPermission('routeHeaders.update'),
              canChangeStatus: hasPermission('routeHeaders.status'),
              canDelete: hasPermission('routeHeaders.delete'),
            }}
            onView={setDetailsRouteHeader}
            onEdit={(routeHeader) => setFormDialog({ mode: 'edit', routeHeader })}
            onToggleStatus={setStatusRouteHeader}
            onDelete={setDeleteRouteHeader}
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

      {formDialog?.mode === 'create' && (
        <CreateRouteHeaderForm
          open
          onOpenChange={(open) => !open && setFormDialog(null)}
          onSuccess={(routeHeader) => {
            setFormDialog(null);
            showFeedback('success', t('routeHeaders.success.created', { name: routeHeader.name }));
            setDetailsRouteHeader(routeHeader);
          }}
        />
      )}

      {formDialog?.mode === 'edit' && (
        <EditRouteHeaderForm
          open
          onOpenChange={(open) => !open && setFormDialog(null)}
          routeHeader={formDialog.routeHeader}
          onSuccess={(routeHeader) => {
            setFormDialog(null);
            showFeedback('success', t('routeHeaders.success.updated', { name: routeHeader.name }));
          }}
        />
      )}

      {statusRouteHeader && (
        <RouteHeaderStatusDialog
          open
          routeHeader={statusRouteHeader}
          onOpenChange={(open) => !open && setStatusRouteHeader(null)}
          onSuccess={() => {
            setStatusRouteHeader(null);
            showFeedback('success', t('routeHeaders.success.statusChanged'));
          }}
        />
      )}

      {deleteRouteHeader && (
        <RouteHeaderDeleteDialog
          open
          routeHeader={deleteRouteHeader}
          onOpenChange={(open) => !open && setDeleteRouteHeader(null)}
          onSuccess={() => {
            setDeleteRouteHeader(null);
            showFeedback('success', t('routeHeaders.delete.success'));
          }}
        />
      )}

      <RouteHeaderDetailsDrawer
        open={detailsRouteHeader !== null}
        routeHeader={detailsRouteHeader}
        onOpenChange={(open) => !open && setDetailsRouteHeader(null)}
      />
    </div>
  );
}
