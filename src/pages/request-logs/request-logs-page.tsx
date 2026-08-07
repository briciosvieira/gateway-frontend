import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { RequestLogDetailsDrawer } from '@/components/request-logs/request-log-details-drawer';
import { RequestLogFilters } from '@/components/request-logs/request-log-filters';
import { RequestLogsTable } from '@/components/request-logs/request-logs-table';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { PageHeader } from '@/components/shared/page-header';
import { TableEmptyState } from '@/components/shared/table-empty-state';
import { TableErrorState } from '@/components/shared/table-error-state';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { Card } from '@/components/ui/card';
import { useRequestLogs } from '@/features/request-logs/hooks/use-request-logs';
import {
  DEFAULT_REQUEST_LOG_FILTERS,
  REQUEST_LOGS_PAGE_SIZE,
} from '@/features/request-logs/request-logs.constants';
import type {
  FindRequestLogsParams,
  RequestLogListItem,
  RequestLogsFilterState,
} from '@/features/request-logs/request-logs.types';
import {
  buildRequestLogEndDate,
  buildRequestLogStartDate,
  parseRequestLogStatusCode,
} from '@/features/request-logs/request-logs.utils';
import { isApiError } from '@/lib/api/api-error';
import { getApiErrorMessage } from '@/lib/api/api-response';

function toFindRequestLogsParams(filters: RequestLogsFilterState): FindRequestLogsParams {
  return {
    page: filters.page,
    limit: REQUEST_LOGS_PAGE_SIZE,
    search: filters.search || undefined,
    requestOrigin: filters.requestOrigin === 'all' ? undefined : filters.requestOrigin,
    method: filters.method === 'all' ? undefined : filters.method,
    statusCode: parseRequestLogStatusCode(filters.statusCode),
    result: filters.result === 'all' ? undefined : filters.result,
    startDate: buildRequestLogStartDate(filters.startDate),
    endDate: buildRequestLogEndDate(filters.endDate),
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };
}

export function RequestLogsPage() {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<RequestLogsFilterState>(DEFAULT_REQUEST_LOG_FILTERS);
  const [detailsRequestLog, setDetailsRequestLog] = useState<RequestLogListItem | null>(null);

  function updateFilters(patch: Partial<RequestLogsFilterState>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function clearFilters() {
    setFilters(DEFAULT_REQUEST_LOG_FILTERS);
  }

  // Clicking the "Horário" column always (re)selects `attemptedAt` as the
  // sort field — even if the "Ordenar por" filter had a different field
  // selected — and toggles direction only when it was already the active
  // sort field; otherwise it starts from the sensible default (desc).
  function toggleAttemptedAtSort() {
    const isAttemptedAtActive = filters.sortBy === 'attemptedAt';
    updateFilters({
      sortBy: 'attemptedAt',
      sortOrder: isAttemptedAtActive && filters.sortOrder === 'desc' ? 'asc' : 'desc',
      page: 1,
    });
  }

  const dateRangeError =
    filters.startDate !== '' && filters.endDate !== '' && filters.startDate > filters.endDate
      ? t('requestLogs.filters.dateRangeInvalid')
      : null;

  const params = useMemo(() => toFindRequestLogsParams(filters), [filters]);
  const requestLogsQuery = useRequestLogs(params, dateRangeError === null);
  const rows = requestLogsQuery.data?.items ?? [];
  const pagination = requestLogsQuery.data?.pagination;

  return (
    <div className="space-y-5">
      <PageHeader title={t('requestLogs.title')} description={t('requestLogs.description')} />

      <RequestLogFilters
        value={filters}
        dateRangeError={dateRangeError}
        onChange={updateFilters}
        onClear={clearFilters}
      />

      <Card className="overflow-hidden p-4">
        {requestLogsQuery.isError ? (
          <TableErrorState
            message={getApiErrorMessage(requestLogsQuery.error, t('requestLogs.error'))}
            requestId={
              isApiError(requestLogsQuery.error) ? requestLogsQuery.error.requestId : undefined
            }
            onRetry={() => void requestLogsQuery.refetch()}
          />
        ) : requestLogsQuery.isLoading ? (
          <TableSkeleton columns={12} />
        ) : rows.length === 0 ? (
          <TableEmptyState message={t('requestLogs.empty')} />
        ) : (
          <RequestLogsTable
            rows={rows}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onToggleSort={toggleAttemptedAtSort}
            onView={setDetailsRequestLog}
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

      <RequestLogDetailsDrawer
        open={detailsRequestLog !== null}
        requestLog={detailsRequestLog}
        onOpenChange={(open) => !open && setDetailsRequestLog(null)}
      />
    </div>
  );
}
