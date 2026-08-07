import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ApiKeyClientDrawer } from '@/components/api-keys/api-key-client-drawer';
import { CreateApiKeyForm } from '@/components/api-keys/api-key-form';
import { ApiKeyRevealDialog } from '@/components/api-keys/api-key-reveal-dialog';
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
  API_KEY_CLIENTS_SUMMARY_PAGE_SIZE,
  API_KEY_CLIENTS_SUMMARY_SORT_OPTIONS,
  DEFAULT_API_KEY_CLIENTS_SUMMARY_FILTERS,
} from '@/features/api-keys/api-keys.constants';
import { useApiKeyClientsSummary } from '@/features/api-keys/api-keys.hooks';
import type {
  ApiKeyClientsSummaryFilterState,
  FindApiKeyClientsSummaryParams,
} from '@/features/api-keys/api-keys.types';
import { useAuth } from '@/features/auth/use-auth';
import type { ClientRef } from '@/features/clients/clients.types';
import { isApiError } from '@/lib/api/api-error';
import { getApiErrorMessage } from '@/lib/api/api-response';

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

const FEEDBACK_TIMEOUT_MS = 4000;

function toFindApiKeyClientsSummaryParams(
  filters: ApiKeyClientsSummaryFilterState,
): FindApiKeyClientsSummaryParams {
  return {
    page: filters.page,
    limit: API_KEY_CLIENTS_SUMMARY_PAGE_SIZE,
    search: filters.search || undefined,
    status: filters.status === 'all' ? undefined : filters.status,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };
}

/**
 * Main view is organized by client, sourced from the real, paginated
 * `GET /api-keys/clients-summary` — only clients with at least one API Key
 * ever appear (backend-enforced), and the STATUS column is derived from the
 * aggregate (`active > 0`), never from the client entity's own `active`
 * flag. Selecting a client opens `ApiKeyClientDrawer`, which queries that
 * client's keys via the existing, already-paginated
 * `GET /api-keys?clientId=<id>` — unchanged.
 */
export function ApiKeysPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const [filters, setFilters] = useState<ApiKeyClientsSummaryFilterState>(
    DEFAULT_API_KEY_CLIENTS_SUMMARY_FILTERS,
  );
  const [selectedClient, setSelectedClient] = useState<ClientRef | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [revealKey, setRevealKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  function showFeedback(type: FeedbackState['type'], message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), FEEDBACK_TIMEOUT_MS);
  }

  function updateFilters(patch: Partial<ApiKeyClientsSummaryFilterState>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function clearFilters() {
    setFilters(DEFAULT_API_KEY_CLIENTS_SUMMARY_FILTERS);
  }

  const params = useMemo(() => toFindApiKeyClientsSummaryParams(filters), [filters]);
  const summaryQuery = useApiKeyClientsSummary(params);
  const rows = summaryQuery.data?.items ?? [];
  const pagination = summaryQuery.data?.pagination;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('apiKeys.title')}
        description={t('apiKeys.description')}
        actions={
          hasPermission('apiKeys.create') && (
            <Button type="button" onClick={() => setShowCreateForm(true)}>
              <Plus className="size-4" aria-hidden="true" />
              {t('apiKeys.new')}
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
        defaultValue={DEFAULT_API_KEY_CLIENTS_SUMMARY_FILTERS}
        sortOptions={API_KEY_CLIENTS_SUMMARY_SORT_OPTIONS.map((option) => ({
          value: option,
          label: t(`apiKeys.clientsView.sortOptions.${option}`),
        }))}
        labels={{
          searchPlaceholder: t('apiKeys.clientsView.searchPlaceholder'),
          status: t('shared.clientResource.status'),
          allStatuses: t('apiKeys.clientsView.allStatuses'),
          active: t('shared.status.active'),
          inactive: t('shared.status.inactive'),
          sortBy: t('apiKeys.clientsView.sortBy'),
          sortOrder: t('apiKeys.clientsView.sortOrder'),
          ascending: t('apiKeys.clientsView.ascending'),
          descending: t('apiKeys.clientsView.descending'),
          clear: t('apiKeys.clientsView.clear'),
        }}
      />

      <Card className="overflow-hidden p-4">
        {summaryQuery.isError ? (
          <TableErrorState
            message={getApiErrorMessage(summaryQuery.error, t('apiKeys.error'))}
            requestId={isApiError(summaryQuery.error) ? summaryQuery.error.requestId : undefined}
            onRetry={() => void summaryQuery.refetch()}
          />
        ) : summaryQuery.isLoading ? (
          <TableSkeleton columns={4} />
        ) : rows.length === 0 ? (
          <TableEmptyState message={t('apiKeys.empty')} />
        ) : (
          <ClientResourceListTable
            rows={rows}
            getClient={(row) => row.client}
            isActive={(row) => row.active > 0}
            renderCounts={(row) =>
              t('apiKeys.clientsView.counts', {
                total: row.total,
                active: row.active,
                inactive: row.inactive,
                revoked: row.revoked,
              })
            }
            actionLabel={t('apiKeys.clientsView.action')}
            caption={t('apiKeys.title')}
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
        <CreateApiKeyForm
          open
          onOpenChange={setShowCreateForm}
          onSuccess={(result) => {
            setShowCreateForm(false);
            showFeedback('success', t('apiKeys.success.created'));
            setRevealKey(result.key);
          }}
        />
      )}

      {revealKey && (
        <ApiKeyRevealDialog open apiKey={revealKey} onClose={() => setRevealKey(null)} />
      )}

      <ApiKeyClientDrawer
        open={selectedClient !== null}
        client={selectedClient}
        onOpenChange={(open) => !open && setSelectedClient(null)}
      />
    </div>
  );
}
