import type {
  FindRequestLogsParams,
  RequestLog,
  RequestLogListItem,
} from '@/features/request-logs/request-logs.types';
import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/types/api';
import type { PaginatedData } from '@/types/pagination';

export async function findRequestLogs(
  params: FindRequestLogsParams,
  signal?: AbortSignal,
): Promise<PaginatedData<RequestLogListItem>> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedData<RequestLogListItem>>>(
    '/request-logs',
    {
      params,
      signal,
    },
  );

  return response.data.data;
}

export async function findRequestLogById(id: string, signal?: AbortSignal): Promise<RequestLog> {
  const response = await apiClient.get<ApiSuccessResponse<RequestLog>>(`/request-logs/${id}`, {
    signal,
  });

  return response.data.data;
}

export async function findRequestLogByRequestId(
  requestId: string,
  signal?: AbortSignal,
): Promise<RequestLog> {
  const response = await apiClient.get<ApiSuccessResponse<RequestLog>>(
    `/request-logs/by-request-id/${requestId}`,
    { signal },
  );

  return response.data.data;
}
