import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
  getOverview,
  getRecentRequests,
  getRequestsOverTime,
  getStatusDistribution,
  getTopClients,
  getTopRoutes,
  searchClients,
  searchGatewayRoutes,
} from '@/features/dashboard/dashboard.service';
import type { DashboardPeriodQuery } from '@/features/dashboard/dashboard.types';
import { isApiError } from '@/lib/api/api-error';

const DASHBOARD_STALE_TIME = 30_000;
const DASHBOARD_REFETCH_INTERVAL = 60_000;
const RECENT_REQUESTS_DISPLAY_LIMIT = 10;

/** Only retries on 5xx responses, up to twice — never on 4xx or network errors. */
function dashboardRetry(failureCount: number, error: unknown): boolean {
  if (!isApiError(error)) return false;
  return error.statusCode >= 500 && failureCount < 2;
}

export function useDashboard(filters?: DashboardPeriodQuery) {
  return useQuery({
    queryKey: ['dashboard', 'overview', filters],
    queryFn: ({ signal }) => getOverview(filters, signal),
    staleTime: DASHBOARD_STALE_TIME,
    refetchInterval: DASHBOARD_REFETCH_INTERVAL,
    retry: dashboardRetry,
  });
}

export interface DashboardCardViewModel {
  key: 'clients' | 'apiKeys' | 'routes' | 'requests' | 'errors' | 'successRate';
  value: number;
  unit?: 'percent';
}

export function useDashboardCards(filters?: DashboardPeriodQuery) {
  const query = useDashboard(filters);

  const cards = useMemo<DashboardCardViewModel[] | undefined>(() => {
    const overview = query.data;
    if (!overview) return undefined;

    return [
      { key: 'clients', value: overview.totalClients },
      { key: 'apiKeys', value: overview.totalApiKeys },
      { key: 'routes', value: overview.totalRoutes },
      { key: 'requests', value: overview.requestsInPeriod },
      { key: 'errors', value: overview.failedRequests },
      { key: 'successRate', value: overview.successRate, unit: 'percent' },
    ];
  }, [query.data]);

  return { ...query, cards };
}

export function useRequestsOverTimeChart(filters?: DashboardPeriodQuery) {
  return useQuery({
    queryKey: ['dashboard', 'requests-over-time', filters],
    queryFn: ({ signal }) => getRequestsOverTime(filters, signal),
    staleTime: DASHBOARD_STALE_TIME,
    refetchInterval: DASHBOARD_REFETCH_INTERVAL,
    retry: dashboardRetry,
  });
}

export function useStatusDistributionChart(filters?: DashboardPeriodQuery) {
  return useQuery({
    queryKey: ['dashboard', 'status-distribution', filters],
    queryFn: ({ signal }) => getStatusDistribution(filters, signal),
    staleTime: DASHBOARD_STALE_TIME,
    refetchInterval: DASHBOARD_REFETCH_INTERVAL,
    retry: dashboardRetry,
  });
}

export function useDashboardCharts(filters?: DashboardPeriodQuery) {
  const requestsOverTime = useRequestsOverTimeChart(filters);
  const statusDistribution = useStatusDistributionChart(filters);

  return { requestsOverTime, statusDistribution };
}

export function useTopClients(limit = 10, filters?: DashboardPeriodQuery) {
  return useQuery({
    queryKey: ['dashboard', 'top-clients', limit, filters],
    queryFn: ({ signal }) => getTopClients({ limit, ...filters }, signal),
    staleTime: DASHBOARD_STALE_TIME,
    refetchInterval: DASHBOARD_REFETCH_INTERVAL,
    retry: dashboardRetry,
  });
}

export function useTopRoutes(limit = 10, filters?: DashboardPeriodQuery) {
  return useQuery({
    queryKey: ['dashboard', 'top-routes', limit, filters],
    queryFn: ({ signal }) => getTopRoutes({ limit, ...filters }, signal),
    staleTime: DASHBOARD_STALE_TIME,
    refetchInterval: DASHBOARD_REFETCH_INTERVAL,
    retry: dashboardRetry,
  });
}

export function useRecentRequests(filters?: DashboardPeriodQuery) {
  return useQuery({
    queryKey: ['dashboard', 'recent-requests', filters],
    queryFn: ({ signal }) => getRecentRequests(filters, signal),
    staleTime: DASHBOARD_STALE_TIME,
    refetchInterval: DASHBOARD_REFETCH_INTERVAL,
    retry: dashboardRetry,
    select: (data) => data.slice(0, RECENT_REQUESTS_DISPLAY_LIMIT),
  });
}

/**
 * Populates the Client/Route comboboxes in the Dashboard filter bar from the
 * real list endpoints. `enabled` gates the request so it only fires while
 * the combobox is open, avoiding requests on every keystroke render.
 */
export function useDashboardClientOptions(search: string, enabled: boolean) {
  return useQuery({
    queryKey: ['dashboard', 'client-options', search],
    queryFn: ({ signal }) => searchClients({ search, limit: 10 }, signal),
    enabled,
    staleTime: DASHBOARD_STALE_TIME,
  });
}

export function useDashboardRouteOptions(search: string, enabled: boolean) {
  return useQuery({
    queryKey: ['dashboard', 'route-options', search],
    queryFn: ({ signal }) => searchGatewayRoutes({ search, limit: 10 }, signal),
    enabled,
    staleTime: DASHBOARD_STALE_TIME,
  });
}
