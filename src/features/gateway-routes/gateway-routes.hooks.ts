import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { findClients } from '@/features/clients/clients.service';
import {
  changeGatewayRouteStatus,
  createGatewayRoute,
  deleteGatewayRoute,
  findGatewayRouteById,
  findGatewayRouteClientsSummary,
  findGatewayRoutes,
  updateGatewayRoute,
} from '@/features/gateway-routes/gateway-routes.service';
import type {
  ChangeGatewayRouteStatusPayload,
  CreateGatewayRoutePayload,
  FindGatewayRouteClientsSummaryParams,
  FindGatewayRoutesParams,
  UpdateGatewayRoutePayload,
} from '@/features/gateway-routes/gateway-routes.types';
import { isApiError } from '@/lib/api/api-error';

export const gatewayRouteKeys = {
  all: ['gateway-routes'] as const,
  lists: () => [...gatewayRouteKeys.all, 'list'] as const,
  list: (params: FindGatewayRoutesParams) => [...gatewayRouteKeys.lists(), params] as const,
  details: () => [...gatewayRouteKeys.all, 'detail'] as const,
  detail: (id: string) => [...gatewayRouteKeys.details(), id] as const,
};

export const gatewayRouteClientsSummaryKeys = {
  all: ['gateway-routes', 'clients-summary'] as const,
  lists: () => [...gatewayRouteClientsSummaryKeys.all, 'list'] as const,
  list: (params: FindGatewayRouteClientsSummaryParams) =>
    [...gatewayRouteClientsSummaryKeys.lists(), params] as const,
};

/** Invalidated by every Gateway Route mutation alongside the resource's own query keys, keeping the main clients-summary view in sync. */
function invalidateGatewayRouteClientsSummary(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: gatewayRouteClientsSummaryKeys.lists() });
}

/** Only retries on 5xx responses, up to twice — never on 4xx or network errors. */
function gatewayRoutesRetry(failureCount: number, error: unknown): boolean {
  if (!isApiError(error)) return false;
  return error.statusCode >= 500 && failureCount < 2;
}

export function useGatewayRoutes(params: FindGatewayRoutesParams) {
  return useQuery({
    queryKey: gatewayRouteKeys.list(params),
    queryFn: ({ signal }) => findGatewayRoutes(params, signal),
    staleTime: 30_000,
    retry: gatewayRoutesRetry,
    // Keeps the current page's rows on screen while the next page loads.
    placeholderData: keepPreviousData,
  });
}

export function useGatewayRouteClientsSummary(params: FindGatewayRouteClientsSummaryParams) {
  return useQuery({
    queryKey: gatewayRouteClientsSummaryKeys.list(params),
    queryFn: ({ signal }) => findGatewayRouteClientsSummary(params, signal),
    staleTime: 30_000,
    retry: gatewayRoutesRetry,
    // Keeps the current page's rows on screen while the next page loads.
    placeholderData: keepPreviousData,
  });
}

export function useGatewayRoute(id: string | undefined) {
  return useQuery({
    queryKey: gatewayRouteKeys.detail(id ?? ''),
    queryFn: ({ signal }) => findGatewayRouteById(id ?? '', signal),
    enabled: Boolean(id),
    retry: gatewayRoutesRetry,
  });
}

export function useCreateGatewayRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGatewayRoutePayload) => createGatewayRoute(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: gatewayRouteKeys.lists() });
      invalidateGatewayRouteClientsSummary(queryClient);
    },
  });
}

export function useUpdateGatewayRoute(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateGatewayRoutePayload) => updateGatewayRoute(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: gatewayRouteKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: gatewayRouteKeys.detail(id) });
      invalidateGatewayRouteClientsSummary(queryClient);
    },
  });
}

export function useChangeGatewayRouteStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangeGatewayRouteStatusPayload) => changeGatewayRouteStatus(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: gatewayRouteKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: gatewayRouteKeys.detail(id) });
      invalidateGatewayRouteClientsSummary(queryClient);
    },
  });
}

export function useDeleteGatewayRoute(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteGatewayRoute(id),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: gatewayRouteKeys.lists() });
      queryClient.removeQueries({ queryKey: gatewayRouteKeys.detail(id) });
      invalidateGatewayRouteClientsSummary(queryClient);
    },
    onError: (error) => {
      // 404 means the record is already gone (e.g. deleted elsewhere) — refresh the list to drop it.
      if (isApiError(error) && error.statusCode === 404) {
        void queryClient.invalidateQueries({ queryKey: gatewayRouteKeys.lists() });
        invalidateGatewayRouteClientsSummary(queryClient);
      }
    },
  });
}

/**
 * Populates the client combobox in the Gateway Routes filter bar and create
 * form. Reuses the real Clients module (`GET /clients?search=&limit=`) —
 * same pattern as the API Keys and Allowed IPs client pickers.
 */
export function useGatewayRouteClientOptions(search: string, enabled: boolean) {
  return useQuery({
    queryKey: ['gateway-routes', 'client-options', search],
    queryFn: ({ signal }) => findClients({ search, limit: 10 }, signal),
    select: (data) => data.items,
    enabled,
    staleTime: 30_000,
  });
}
