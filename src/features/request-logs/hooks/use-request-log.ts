import { useQuery } from '@tanstack/react-query';

import { requestLogKeys } from '@/features/request-logs/request-logs.query-keys';
import {
  findRequestLogById,
  findRequestLogByRequestId,
} from '@/features/request-logs/request-logs.service';
import { isApiError } from '@/lib/api/api-error';

function requestLogsRetry(failureCount: number, error: unknown): boolean {
  if (!isApiError(error)) return false;
  return error.statusCode >= 500 && failureCount < 2;
}

export function useRequestLog(id: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: requestLogKeys.detail(id ?? ''),
    queryFn: ({ signal }) => findRequestLogById(id ?? '', signal),
    enabled: enabled && Boolean(id),
    retry: requestLogsRetry,
  });
}

export function useRequestLogByRequestId(requestId: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: requestLogKeys.byRequestId(requestId ?? ''),
    queryFn: ({ signal }) => findRequestLogByRequestId(requestId ?? '', signal),
    enabled: enabled && Boolean(requestId),
    retry: requestLogsRetry,
  });
}
