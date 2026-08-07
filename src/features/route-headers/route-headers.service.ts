import type {
  ChangeRouteHeaderStatusPayload,
  CreateRouteHeaderPayload,
  FindRouteHeadersParams,
  RouteHeader,
  UpdateRouteHeaderPayload,
} from '@/features/route-headers/route-headers.types';
import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/types/api';
import type { PaginatedData } from '@/types/pagination';

export async function findRouteHeaders(
  params: FindRouteHeadersParams,
  signal?: AbortSignal,
): Promise<PaginatedData<RouteHeader>> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedData<RouteHeader>>>(
    '/route-headers',
    { params, signal },
  );

  return response.data.data;
}

export async function findRouteHeaderById(id: string, signal?: AbortSignal): Promise<RouteHeader> {
  const response = await apiClient.get<ApiSuccessResponse<RouteHeader>>(`/route-headers/${id}`, {
    signal,
  });

  return response.data.data;
}

export async function createRouteHeader(payload: CreateRouteHeaderPayload): Promise<RouteHeader> {
  const response = await apiClient.post<ApiSuccessResponse<RouteHeader>>('/route-headers', payload);

  return response.data.data;
}

export async function updateRouteHeader(
  id: string,
  payload: UpdateRouteHeaderPayload,
): Promise<RouteHeader> {
  const response = await apiClient.patch<ApiSuccessResponse<RouteHeader>>(
    `/route-headers/${id}`,
    payload,
  );

  return response.data.data;
}

export async function changeRouteHeaderStatus(
  id: string,
  payload: ChangeRouteHeaderStatusPayload,
): Promise<RouteHeader> {
  const response = await apiClient.patch<ApiSuccessResponse<RouteHeader>>(
    `/route-headers/${id}/status`,
    payload,
  );

  return response.data.data;
}

export async function deleteRouteHeader(id: string): Promise<void> {
  await apiClient.delete(`/route-headers/${id}`);
}
