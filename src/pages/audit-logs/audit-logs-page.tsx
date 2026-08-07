import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AuditLogDetailsDrawer } from '@/components/audit-logs/audit-log-details-drawer';
import { AuditLogFilters } from '@/components/audit-logs/audit-log-filters';
import { AuditLogsTable } from '@/components/audit-logs/audit-logs-table';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { PageHeader } from '@/components/shared/page-header';
import { TableEmptyState } from '@/components/shared/table-empty-state';
import { TableErrorState } from '@/components/shared/table-error-state';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { Card } from '@/components/ui/card';
import {
  AUDIT_LOGS_PAGE_SIZE,
  DEFAULT_AUDIT_LOG_FILTERS,
} from '@/features/audit-logs/audit-logs.constants';
import type {
  AuditLog,
  AuditLogsFilterState,
  FindAuditLogsParams,
} from '@/features/audit-logs/audit-logs.types';
import { useAuditLogs } from '@/features/audit-logs/hooks/use-audit-logs';
import { isApiError } from '@/lib/api/api-error';
import { getApiErrorMessage } from '@/lib/api/api-response';

function toFindAuditLogsParams(filters: AuditLogsFilterState): FindAuditLogsParams {
  return {
    page: filters.page,
    limit: AUDIT_LOGS_PAGE_SIZE,
    action: filters.action === 'all' ? undefined : filters.action,
    entity: filters.entity === 'all' ? undefined : filters.entity,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  };
}

function matchesAuditLogSearch(
  auditLog: AuditLog,
  search: string,
  t: (key: string) => string,
): boolean {
  const normalizedSearch = search.trim().toLowerCase();

  if (normalizedSearch === '') {
    return true;
  }

  const searchableParts = [
    auditLog.user?.id,
    auditLog.user?.name,
    auditLog.user?.username,
    auditLog.entity,
    t(`auditLogs.entitiesMap.${auditLog.entity}`),
    auditLog.action,
    t(`auditLogs.actionsMap.${auditLog.action}`),
    auditLog.entityId,
    auditLog.requestId,
    auditLog.description,
    auditLog.sourceIp,
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());

  return searchableParts.some((value) => value.includes(normalizedSearch));
}

export function AuditLogsPage() {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<AuditLogsFilterState>(DEFAULT_AUDIT_LOG_FILTERS);
  const [detailsAuditLog, setDetailsAuditLog] = useState<AuditLog | null>(null);

  function updateFilters(patch: Partial<AuditLogsFilterState>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function clearFilters() {
    setFilters(DEFAULT_AUDIT_LOG_FILTERS);
  }

  const dateRangeError =
    filters.startDate !== '' && filters.endDate !== '' && filters.startDate > filters.endDate
      ? t('auditLogs.filters.dateRangeInvalid')
      : null;

  const params = useMemo(() => toFindAuditLogsParams(filters), [filters]);
  const auditLogsQuery = useAuditLogs(params, dateRangeError === null);
  const rows = auditLogsQuery.data?.items;
  const visibleRows = useMemo(
    () => (rows ?? []).filter((auditLog) => matchesAuditLogSearch(auditLog, filters.search, t)),
    [filters.search, rows, t],
  );
  const pagination = auditLogsQuery.data?.pagination;

  return (
    <div className="space-y-5">
      <PageHeader title={t('auditLogs.title')} description={t('auditLogs.description')} />

      <AuditLogFilters
        value={filters}
        dateRangeError={dateRangeError}
        onChange={updateFilters}
        onClear={clearFilters}
      />

      <Card className="overflow-hidden p-4">
        {auditLogsQuery.isError ? (
          <TableErrorState
            message={getApiErrorMessage(auditLogsQuery.error, t('auditLogs.error'))}
            requestId={
              isApiError(auditLogsQuery.error) ? auditLogsQuery.error.requestId : undefined
            }
            onRetry={() => void auditLogsQuery.refetch()}
          />
        ) : auditLogsQuery.isLoading ? (
          <TableSkeleton columns={7} />
        ) : visibleRows.length === 0 ? (
          <TableEmptyState message={t('auditLogs.empty')} />
        ) : (
          <AuditLogsTable rows={visibleRows} onView={setDetailsAuditLog} />
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

      <AuditLogDetailsDrawer
        open={detailsAuditLog !== null}
        auditLog={detailsAuditLog}
        onOpenChange={(open) => !open && setDetailsAuditLog(null)}
      />
    </div>
  );
}
