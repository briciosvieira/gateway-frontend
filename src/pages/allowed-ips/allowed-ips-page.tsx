import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AllowedIpClientDrawer } from '@/components/allowed-ips/allowed-ip-client-drawer';
import { CreateAllowedIpForm } from '@/components/allowed-ips/allowed-ip-form';
import { ClientResourceListTable } from '@/components/shared/client-resource-list-table';
import { ClientResourceSummaryFilters } from '@/components/shared/client-resource-summary-filters';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { PageHeader } from '@/components/shared/page-header';
import { TableEmptyState } from '@/components/shared/table-empty-state';
import { TableErrorState } from '@/components/shared/table-error-state';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ALLOWED_IP_CLIENTS_SUMMARY_PAGE_SIZE,
  ALLOWED_IP_CLIENTS_SUMMARY_SORT_OPTIONS,
  DEFAULT_ALLOWED_IP_CLIENTS_SUMMARY_FILTERS,
} from '@/features/allowed-ips/allowed-ips.constants';
import { useAllowedIpClientsSummary } from '@/features/allowed-ips/allowed-ips.hooks';
import type {
  AllowedIpClientsSummaryFilterState,
  FindAllowedIpClientsSummaryParams,
} from '@/features/allowed-ips/allowed-ips.types';
import { useAuth } from '@/features/auth/use-auth';
import type { ClientRef } from '@/features/clients/clients.types';
import { isApiError } from '@/lib/api/api-error';
import { getApiErrorMessage } from '@/lib/api/api-response';

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

const FEEDBACK_TIMEOUT_MS = 4000;

function toFindAllowedIpClientsSummaryParams(
  filters: AllowedIpClientsSummaryFilterState,
): FindAllowedIpClientsSummaryParams {
  return {
    page: filters.page,
    limit: ALLOWED_IP_CLIENTS_SUMMARY_PAGE_SIZE,
    search: filters.search || undefined,
    status: filters.status === 'all' ? undefined : filters.status,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };
}

/**
 * Main view is organized by client, sourced from the real, paginated
 * `GET /allowed-ips/clients-summary` — only clients with at least one
 * Allowed IP ever appear (backend-enforced), and the STATUS column is
 * derived from the aggregate (`active > 0`), never from the client entity's
 * own `active` flag. Selecting a client opens `AllowedIpClientDrawer`,
 * which queries that client's IPs via the existing, already-paginated
 * `GET /allowed-ips?clientId=<id>` — unchanged.
 */
export function AllowedIpsPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const [filters, setFilters] = useState<AllowedIpClientsSummaryFilterState>(
    DEFAULT_ALLOWED_IP_CLIENTS_SUMMARY_FILTERS,
  );
  const [selectedClient, setSelectedClient] = useState<ClientRef | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  function showFeedback(type: FeedbackState['type'], message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), FEEDBACK_TIMEOUT_MS);
  }

  function updateFilters(patch: Partial<AllowedIpClientsSummaryFilterState>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function clearFilters() {
    setFilters(DEFAULT_ALLOWED_IP_CLIENTS_SUMMARY_FILTERS);
  }

  const params = useMemo(() => toFindAllowedIpClientsSummaryParams(filters), [filters]);
  const summaryQuery = useAllowedIpClientsSummary(params);
  const rows = summaryQuery.data?.items ?? [];
  const pagination = summaryQuery.data?.pagination;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('allowedIps.title')}
        description={t('allowedIps.description')}
        actions={
          hasPermission('allowedIps.create') && (
            <Button type="button" onClick={() => setShowCreateForm(true)}>
              <Plus className="size-4" aria-hidden="true" />
              {t('allowedIps.new')}
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
        defaultValue={DEFAULT_ALLOWED_IP_CLIENTS_SUMMARY_FILTERS}
        sortOptions={ALLOWED_IP_CLIENTS_SUMMARY_SORT_OPTIONS.map((option) => ({
          value: option,
          label: t(`allowedIps.clientsView.sortOptions.${option}`),
        }))}
        labels={{
          searchPlaceholder: t('allowedIps.clientsView.searchPlaceholder'),
          status: t('shared.clientResource.status'),
          allStatuses: t('allowedIps.clientsView.allStatuses'),
          active: t('shared.status.active'),
          inactive: t('shared.status.inactive'),
          sortBy: t('allowedIps.clientsView.sortBy'),
          sortOrder: t('allowedIps.clientsView.sortOrder'),
          ascending: t('allowedIps.clientsView.ascending'),
          descending: t('allowedIps.clientsView.descending'),
          clear: t('allowedIps.clientsView.clear'),
        }}
      />

      <Card className="overflow-hidden p-4">
        {summaryQuery.isError ? (
          <TableErrorState
            message={getApiErrorMessage(summaryQuery.error, t('allowedIps.error'))}
            requestId={isApiError(summaryQuery.error) ? summaryQuery.error.requestId : undefined}
            onRetry={() => void summaryQuery.refetch()}
          />
        ) : summaryQuery.isLoading ? (
          <TableSkeleton columns={4} />
        ) : rows.length === 0 ? (
          <TableEmptyState message={t('allowedIps.empty')} />
        ) : (
          <ClientResourceListTable
            rows={rows}
            getClient={(row) => row.client}
            isActive={(row) => row.active > 0}
            renderCounts={(row) =>
              t('allowedIps.clientsView.counts', {
                total: row.total,
                active: row.active,
                inactive: row.inactive,
              })
            }
            actionLabel={t('allowedIps.clientsView.action')}
            caption={t('allowedIps.title')}
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
        <CreateAllowedIpForm
          open
          onOpenChange={setShowCreateForm}
          onSuccess={(result) => {
            setShowCreateForm(false);
            showFeedback('success', t('allowedIps.success.created', { address: result.address }));
          }}
        />
      )}

      <AllowedIpClientDrawer
        open={selectedClient !== null}
        client={selectedClient}
        onOpenChange={(open) => !open && setSelectedClient(null)}
      />
    </div>
  );
}
