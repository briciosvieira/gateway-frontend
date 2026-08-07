import type { AuditLog, FindAuditLogsParams } from '@/features/audit-logs/audit-logs.types';
import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/types/api';
import type { PaginatedData } from '@/types/pagination';

export async function findAuditLogs(
  params: FindAuditLogsParams,
  signal?: AbortSignal,
): Promise<PaginatedData<AuditLog>> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedData<AuditLog>>>('/audit-logs', {
    params,
    signal,
  });

  return response.data.data;
}

export async function findAuditLogById(id: string, signal?: AbortSignal): Promise<AuditLog> {
  const response = await apiClient.get<ApiSuccessResponse<AuditLog>>(`/audit-logs/${id}`, {
    signal,
  });

  return response.data.data;
}
