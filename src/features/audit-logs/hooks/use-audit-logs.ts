import { keepPreviousData, useQuery } from '@tanstack/react-query';

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
