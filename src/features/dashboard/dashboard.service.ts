import type {
  DashboardChartPoint,
  DashboardClientOption,
  DashboardLookupQuery,
  DashboardOverview,
  DashboardPeriodQuery,
  DashboardRecentRequest,
  DashboardRouteOption,
  DashboardStatusDistributionItem,
  DashboardTopClient,
  DashboardTopListQuery,
  DashboardTopRoute,
} from '@/features/dashboard/dashboard.types';
import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/types/api';
import type { PaginatedData } from '@/types/pagination';

export async function getOverview(
  query?: DashboardPeriodQuery,
  signal?: AbortSignal,
): Promise<DashboardOverview> {
  const response = await apiClient.get<ApiSuccessResponse<DashboardOverview>>(
    '/dashboard/overview',
    { params: query, signal },
  );

  return response.data.data;
}

export async function getRequestsOverTime(
  query?: DashboardPeriodQuery,
  signal?: AbortSignal,
): Promise<DashboardChartPoint[]> {
  const response = await apiClient.get<ApiSuccessResponse<DashboardChartPoint[]>>(
    '/dashboard/requests-over-time',
    { params: query, signal },
  );

  return response.data.data;
}

export async function getStatusDistribution(
  query?: DashboardPeriodQuery,
  signal?: AbortSignal,
): Promise<DashboardStatusDistributionItem[]> {
  const response = await apiClient.get<ApiSuccessResponse<DashboardStatusDistributionItem[]>>(
    '/dashboard/status-distribution',
    { params: query, signal },
  );

  return response.data.data;
}

export async function getTopClients(
  query?: DashboardTopListQuery,
  signal?: AbortSignal,
): Promise<DashboardTopClient[]> {
  const response = await apiClient.get<ApiSuccessResponse<DashboardTopClient[]>>(
    '/dashboard/top-clients',
    { params: query, signal },
  );

  return response.data.data;
}

export async function getTopRoutes(
  query?: DashboardTopListQuery,
  signal?: AbortSignal,
): Promise<DashboardTopRoute[]> {
  const response = await apiClient.get<ApiSuccessResponse<DashboardTopRoute[]>>(
    '/dashboard/top-routes',
    { params: query, signal },
  );

  return response.data.data;
}

export async function getRecentRequests(
  query?: DashboardPeriodQuery,
  signal?: AbortSignal,
): Promise<DashboardRecentRequest[]> {
  const response = await apiClient.get<ApiSuccessResponse<DashboardRecentRequest[]>>(
    '/dashboard/recent-requests',
    { params: query, signal },
  );

  return response.data.data;
}

/**
 * Backs the Client combobox in the Dashboard filter bar. Uses the real
 * `GET /clients` list endpoint (search + limit), not a dashboard endpoint —
 * the dashboard aggregation endpoints do not accept a `clientId` filter
 * (confirmed against backend source), so this only populates the picker.
 */
export async function searchClients(
  query: DashboardLookupQuery,
  signal?: AbortSignal,
): Promise<DashboardClientOption[]> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedData<DashboardClientOption>>>(
    '/clients',
    { params: { search: query.search, limit: query.limit ?? 10 }, signal },
  );

  return response.data.data.items;
}

/**
 * Backs the Route combobox in the Dashboard filter bar. Same caveat as
 * `searchClients`: `GET /gateway-routes` is the real list endpoint, but the
 * dashboard endpoints do not accept a `gatewayRouteId` filter.
 */
export async function searchGatewayRoutes(
  query: DashboardLookupQuery,
  signal?: AbortSignal,
): Promise<DashboardRouteOption[]> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedData<DashboardRouteOption>>>(
    '/gateway-routes',
    { params: { search: query.search, limit: query.limit ?? 10 }, signal },
  );

  return response.data.data.items;
}
