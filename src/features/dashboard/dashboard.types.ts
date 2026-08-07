export type DashboardPeriod = 'today' | 'last7days' | 'last30days' | 'last90days' | 'custom';

export interface DashboardPeriodQuery {
  period?: DashboardPeriod;
  startDate?: string;
  endDate?: string;
}

export interface DashboardTopListQuery extends DashboardPeriodQuery {
  limit?: number;
}

/**
 * Mirrors the backend's DashboardOverview exactly
 * (src/modules/dashboard/interfaces/dashboard-overview.interface.ts).
 * There is no allowed-IPs counter and no minimum response time field on the
 * real endpoint — do not add them here without confirming the backend
 * exposes them first.
 */
export interface DashboardOverview {
  totalClients: number;
  activeClients: number;
  totalApiKeys: number;
  activeApiKeys: number;
  totalRoutes: number;
  activeRoutes: number;
  totalRequests: number;
  requestsInPeriod: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  errorRate: number;
  averageResponseTime: number;
  maxResponseTime: number;
  averageAttempts: number;
}

export interface DashboardChartPoint {
  label: string;
  requests: number;
  success: number;
  error: number;
}

export interface DashboardTopClient {
  clientId: string;
  name: string;
  code: string;
  requests: number;
  errors: number;
  averageResponseTime: number;
}

export interface DashboardTopRoute {
  routeId: string;
  name: string;
  slug: string;
  method: string;
  requests: number;
  errors: number;
  averageResponseTime: number;
}

export interface DashboardStatusDistributionItem {
  statusCode: number;
  total: number;
}

export interface DashboardRecentRequestRef {
  id: string;
  name: string;
  code?: string;
  slug?: string;
}

export interface DashboardRecentRequest {
  requestId: string;
  client: DashboardRecentRequestRef | null;
  route: DashboardRecentRequestRef | null;
  statusCode: number;
  durationMs: number;
  createdAt: string;
}

/**
 * Options for the Client/Route comboboxes in the Dashboard filter bar.
 * Populated from the real `GET /clients` and `GET /gateway-routes` list
 * endpoints (confirmed contract) — trimmed to only the fields the combobox
 * needs to display and identify a result.
 */
export interface DashboardClientOption {
  id: string;
  name: string;
  code: string;
}

export interface DashboardRouteOption {
  id: string;
  name: string;
  slug: string;
}

export interface DashboardLookupQuery {
  search?: string;
  limit?: number;
}

/** UI-only state for the Dashboard filter bar (`DashboardFilters`). */
export interface DashboardFilterState {
  period: DashboardPeriod;
  startDate?: string;
  endDate?: string;
  client: DashboardClientOption | null;
  route: DashboardRouteOption | null;
  statusCode: string;
}

export const DEFAULT_DASHBOARD_FILTERS: DashboardFilterState = {
  period: 'last7days',
  client: null,
  route: null,
  statusCode: '',
};
