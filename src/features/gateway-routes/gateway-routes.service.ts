import type {
  ChangeGatewayRouteStatusPayload,
  CreateGatewayRoutePayload,
  FindGatewayRouteClientsSummaryParams,
  FindGatewayRoutesParams,
  GatewayRoute,
  GatewayRouteClientSummaryItem,
  UpdateGatewayRoutePayload,
} from '@/features/gateway-routes/gateway-routes.types';
import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/types/api';
import type { PaginatedData } from '@/types/pagination';

export async function findGatewayRoutes(
  params: FindGatewayRoutesParams,
  signal?: AbortSignal,
): Promise<PaginatedData<GatewayRoute>> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedData<GatewayRoute>>>(
    '/gateway-routes',
    { params, signal },
  );

  return response.data.data;
}

/** `GET /gateway-routes/clients-summary` — one row per client with at least one route. */
export async function findGatewayRouteClientsSummary(
  params: FindGatewayRouteClientsSummaryParams,
  signal?: AbortSignal,
): Promise<PaginatedData<GatewayRouteClientSummaryItem>> {
  const response = await apiClient.get<
    ApiSuccessResponse<PaginatedData<GatewayRouteClientSummaryItem>>
  >('/gateway-routes/clients-summary', { params, signal });

  return response.data.data;
}

export async function findGatewayRouteById(
  id: string,
  signal?: AbortSignal,
): Promise<GatewayRoute> {
  const response = await apiClient.get<ApiSuccessResponse<GatewayRoute>>(`/gateway-routes/${id}`, {
    signal,
  });

  return response.data.data;
}

export async function createGatewayRoute(
  payload: CreateGatewayRoutePayload,
): Promise<GatewayRoute> {
  const response = await apiClient.post<ApiSuccessResponse<GatewayRoute>>(
    '/gateway-routes',
    payload,
  );

  return response.data.data;
}

export async function updateGatewayRoute(
  id: string,
  payload: UpdateGatewayRoutePayload,
): Promise<GatewayRoute> {
  const response = await apiClient.patch<ApiSuccessResponse<GatewayRoute>>(
    `/gateway-routes/${id}`,
    payload,
  );

  return response.data.data;
}

export async function changeGatewayRouteStatus(
  id: string,
  payload: ChangeGatewayRouteStatusPayload,
): Promise<GatewayRoute> {
  const response = await apiClient.patch<ApiSuccessResponse<GatewayRoute>>(
    `/gateway-routes/${id}/status`,
    payload,
  );

  return response.data.data;
}

/** ADMIN only. Backend returns 204 No Content; fails with 409 while the route still has Route Headers. */
export async function deleteGatewayRoute(id: string): Promise<void> {
  await apiClient.delete(`/gateway-routes/${id}`);
}
