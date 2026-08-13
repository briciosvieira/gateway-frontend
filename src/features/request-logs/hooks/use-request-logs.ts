import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { findApiKeys } from '@/features/api-keys/api-keys.service';
import { findClients } from '@/features/clients/clients.service';
import { findGatewayRoutes } from '@/features/gateway-routes/gateway-routes.service';
import { REQUEST_LOGS_REFETCH_INTERVAL_MS } from '@/features/request-logs/request-logs.constants';
import { requestLogKeys } from '@/features/request-logs/request-logs.query-keys';
import { findRequestLogs } from '@/features/request-logs/request-logs.service';
import type { FindRequestLogsParams } from '@/features/request-logs/request-logs.types';
import { isApiError } from '@/lib/api/api-error';

function requestLogsRetry(failureCount: number, error: unknown): boolean {
  if (!isApiError(error)) return false;
  return error.statusCode >= 500 && failureCount < 2;
}

export function useRequestLogs(params: FindRequestLogsParams, enabled: boolean = true) {
  return useQuery({
    queryKey: requestLogKeys.list(params),
    queryFn: ({ signal }) => findRequestLogs(params, signal),
    staleTime: 30_000,
    retry: requestLogsRetry,
    placeholderData: keepPreviousData,
    // Only while the tab is visible (TanStack Query's default) — polling a
    // backgrounded tab would waste requests without anyone watching.
    refetchInterval: REQUEST_LOGS_REFETCH_INTERVAL_MS,
    enabled,
  });
}

export function useRequestLogClientOptions(search: string, enabled: boolean) {
  return useQuery({
    queryKey: ['request-logs', 'client-options', search],
    queryFn: ({ signal }) => findClients({ search, limit: 10 }, signal),
    select: (data) => data.items,
    enabled,
    staleTime: 30_000,
  });
}

export function useRequestLogApiKeyOptions(search: string, enabled: boolean) {
  return useQuery({
    queryKey: ['request-logs', 'api-key-options', search],
    queryFn: ({ signal }) => findApiKeys({ search, limit: 10 }, signal),
    select: (data) => data.items,
    enabled,
    staleTime: 30_000,
  });
}

export function useRequestLogGatewayRouteOptions(search: string, enabled: boolean) {
  return useQuery({
    queryKey: ['request-logs', 'gateway-route-options', search],
    queryFn: ({ signal }) => findGatewayRoutes({ search, limit: 10 }, signal),
    select: (data) => data.items,
    enabled,
    staleTime: 30_000,
  });
}
