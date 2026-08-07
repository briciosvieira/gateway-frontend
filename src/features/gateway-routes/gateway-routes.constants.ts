import type {
  GatewayHttpMethod,
  GatewayRouteClientsSummaryFilterState,
  GatewayRouteClientsSummarySortBy,
  GatewayRouteSortBy,
  GatewayRoutesFilterState,
} from '@/features/gateway-routes/gateway-routes.types';

/** Matches the backend's default `limit` for `GET /gateway-routes`. */
export const GATEWAY_ROUTES_PAGE_SIZE = 20;

export const GATEWAY_ROUTE_METHODS: GatewayHttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

/** `retryCount` is intentionally absent — not a supported `sortBy` value on the backend. */
export const GATEWAY_ROUTE_SORT_OPTIONS: GatewayRouteSortBy[] = [
  'name',
  'slug',
  'createdAt',
  'updatedAt',
  'timeoutMs',
];

/** Mirrors the backend service's own defaults, applied when the fields are omitted on create. */
export const DEFAULT_GATEWAY_ROUTE_TIMEOUT_MS = 30000;
export const DEFAULT_GATEWAY_ROUTE_RETRY_COUNT = 0;

export const DEFAULT_GATEWAY_ROUTES_FILTERS: GatewayRoutesFilterState = {
  search: '',
  client: null,
  method: 'all',
  status: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
};

/** Matches the backend's default `limit` for `GET /gateway-routes/clients-summary`. */
export const GATEWAY_ROUTE_CLIENTS_SUMMARY_PAGE_SIZE = 20;

export const GATEWAY_ROUTE_CLIENTS_SUMMARY_SORT_OPTIONS: GatewayRouteClientsSummarySortBy[] = [
  'clientName',
  'total',
  'active',
  'inactive',
];

export const DEFAULT_GATEWAY_ROUTE_CLIENTS_SUMMARY_FILTERS: GatewayRouteClientsSummaryFilterState =
  {
    search: '',
    status: 'all',
    sortBy: 'clientName',
    sortOrder: 'asc',
    page: 1,
  };
