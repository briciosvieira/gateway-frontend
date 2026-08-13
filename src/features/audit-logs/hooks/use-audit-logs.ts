import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { AUDIT_LOGS_REFETCH_INTERVAL_MS } from '@/features/audit-logs/audit-logs.constants';
import { auditLogKeys } from '@/features/audit-logs/audit-logs.query-keys';
import { findAuditLogById, findAuditLogs } from '@/features/audit-logs/audit-logs.service';
import type { FindAuditLogsParams } from '@/features/audit-logs/audit-logs.types';
import { isApiError } from '@/lib/api/api-error';

function auditLogsRetry(failureCount: number, error: unknown): boolean {
  if (!isApiError(error)) return false;
  return error.statusCode >= 500 && failureCount < 2;
}

export function useAuditLogs(params: FindAuditLogsParams, enabled: boolean = true) {
  return useQuery({
    queryKey: auditLogKeys.list(params),
    queryFn: ({ signal }) => findAuditLogs(params, signal),
    staleTime: 30_000,
    retry: auditLogsRetry,
    placeholderData: keepPreviousData,
    // Only while the tab is visible (TanStack Query's default) — polling a
    // backgrounded tab would waste requests without anyone watching.
    refetchInterval: AUDIT_LOGS_REFETCH_INTERVAL_MS,
    enabled,
  });
}

export function useAuditLog(id: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: auditLogKeys.detail(id ?? ''),
    queryFn: ({ signal }) => findAuditLogById(id ?? '', signal),
    enabled: enabled && Boolean(id),
    retry: auditLogsRetry,
  });
}
