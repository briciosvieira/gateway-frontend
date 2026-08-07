import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  findGatewayRouteById,
  findGatewayRoutes,
} from '@/features/gateway-routes/gateway-routes.service';
import {
  changeRouteHeaderStatus,
  createRouteHeader,
  deleteRouteHeader,
  findRouteHeaderById,
  findRouteHeaders,
  updateRouteHeader,
} from '@/features/route-headers/route-headers.service';
import type {
  ChangeRouteHeaderStatusPayload,
  CreateRouteHeaderPayload,
  FindRouteHeadersParams,
  RouteHeaderGatewayRouteOption,
  UpdateRouteHeaderPayload,
} from '@/features/route-headers/route-headers.types';
import { toRouteHeaderGatewayRouteOption } from '@/features/route-headers/route-headers.types';
import { isApiError } from '@/lib/api/api-error';

export const routeHeaderKeys = {
  all: ['route-headers'] as const,
  lists: () => [...routeHeaderKeys.all, 'list'] as const,
  list: (params: FindRouteHeadersParams) => [...routeHeaderKeys.lists(), params] as const,
  details: () => [...routeHeaderKeys.all, 'detail'] as const,
  detail: (id: string) => [...routeHeaderKeys.details(), id] as const,
  gatewayRouteOptions: (search: string) =>
    [...routeHeaderKeys.all, 'gateway-route-options', search] as const,
  gatewayRouteDetail: (gatewayRouteId: string) =>
    [...routeHeaderKeys.all, 'gateway-route', gatewayRouteId] as const,
  gatewayRouteContexts: (gatewayRouteIds: string[]) =>
    [...routeHeaderKeys.all, 'gateway-route-contexts', gatewayRouteIds] as const,
};

function routeHeadersRetry(failureCount: number, error: unknown): boolean {
  if (!isApiError(error)) return false;
  return error.statusCode >= 500 && failureCount < 2;
}

export function useRouteHeaders(params: FindRouteHeadersParams) {
  return useQuery({
    queryKey: routeHeaderKeys.list(params),
    queryFn: ({ signal }) => findRouteHeaders(params, signal),
    staleTime: 30_000,
    retry: routeHeadersRetry,
    placeholderData: keepPreviousData,
  });
}

export function useRouteHeader(id: string | undefined) {
  return useQuery({
    queryKey: routeHeaderKeys.detail(id ?? ''),
    queryFn: ({ signal }) => findRouteHeaderById(id ?? '', signal),
    enabled: Boolean(id),
    retry: routeHeadersRetry,
  });
}

export function useCreateRouteHeader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRouteHeaderPayload) => createRouteHeader(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: routeHeaderKeys.lists() });
    },
  });
}

export function useUpdateRouteHeader(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateRouteHeaderPayload) => updateRouteHeader(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: routeHeaderKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: routeHeaderKeys.detail(id) });
    },
  });
}

export function useChangeRouteHeaderStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangeRouteHeaderStatusPayload) => changeRouteHeaderStatus(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: routeHeaderKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: routeHeaderKeys.detail(id) });
    },
  });
}

export function useDeleteRouteHeader(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteRouteHeader(id),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: routeHeaderKeys.lists() });
      queryClient.removeQueries({ queryKey: routeHeaderKeys.detail(id) });
    },
    onError: (error) => {
      if (isApiError(error) && error.statusCode === 404) {
        void queryClient.invalidateQueries({ queryKey: routeHeaderKeys.lists() });
      }
    },
  });
}

export function useRouteHeaderGatewayRouteOptions(search: string, enabled: boolean) {
  return useQuery({
    queryKey: routeHeaderKeys.gatewayRouteOptions(search),
    queryFn: ({ signal }) =>
      findGatewayRoutes(
        {
          search,
          limit: 10,
          sortBy: 'name',
          sortOrder: 'asc',
        },
        signal,
      ),
    select: (data) => data.items.map(toRouteHeaderGatewayRouteOption),
    enabled,
    staleTime: 30_000,
  });
}

export function useRouteHeaderGatewayRoute(
  gatewayRouteId: string | undefined,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: routeHeaderKeys.gatewayRouteDetail(gatewayRouteId ?? ''),
    queryFn: ({ signal }) => findGatewayRouteById(gatewayRouteId ?? '', signal),
    select: toRouteHeaderGatewayRouteOption,
    enabled: enabled && Boolean(gatewayRouteId),
    staleTime: 30_000,
    retry: routeHeadersRetry,
  });
}

export function useRouteHeaderGatewayRouteContexts(gatewayRouteIds: string[]) {
  const uniqueIds = [...new Set(gatewayRouteIds)].sort();

  return useQuery({
    queryKey: routeHeaderKeys.gatewayRouteContexts(uniqueIds),
    queryFn: async ({ signal }) => {
      const routes = await Promise.all(
        uniqueIds.map((gatewayRouteId) => findGatewayRouteById(gatewayRouteId, signal)),
      );

      return routes.reduce<Record<string, RouteHeaderGatewayRouteOption>>((acc, route) => {
        acc[route.id] = toRouteHeaderGatewayRouteOption(route);
        return acc;
      }, {});
    },
    enabled: uniqueIds.length > 0,
    staleTime: 30_000,
    retry: routeHeadersRetry,
  });
}
