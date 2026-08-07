import type { ClientRef } from '@/features/clients/clients.types';

/** Nested client reference returned inside every gateway-route response (`gatewayRouteSelect`). */
export type GatewayRouteClientRef = ClientRef;

export type GatewayHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Mirrors the backend's `gatewayRouteSelect` exactly
 * (src/modules/gateway-routes/gateway-routes.service.ts), plus `publicPath`
 * — computed server-side as `` `/gateway${slug}` `` and appended to every
 * response via `withPublicPath()`. Never reconstruct this path from `slug`
 * on the frontend; always use the value the backend returns.
 */
export interface GatewayRoute {
  id: string;
  clientId: string;
  name: string;
  slug: string;
  description: string | null;
  destinationUrl: string;
  method: GatewayHttpMethod;
  timeoutMs: number;
  retryCount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  client: GatewayRouteClientRef;
  publicPath: string;
}

/** Same shape as `GatewayRoute` — the backend has no separate list-item projection. */
export type GatewayRouteListItem = GatewayRoute;

export type GatewayRouteSortBy = 'name' | 'slug' | 'createdAt' | 'updatedAt' | 'timeoutMs';
export type SortOrder = 'asc' | 'desc';

/** Exact query params accepted by `GET /gateway-routes` (confirmed against backend source). */
export interface FindGatewayRoutesParams {
  page?: number;
  limit?: number;
  search?: string;
  clientId?: string;
  method?: GatewayHttpMethod;
  active?: boolean;
  sortBy?: GatewayRouteSortBy;
  sortOrder?: SortOrder;
}

/**
 * `slug` is required and user-supplied here (unlike `Client.code`) — the
 * backend normalizes/validates it (lowercase, must start with `/`, reserved
 * prefixes rejected, etc.) but does NOT generate it from `name`.
 */
export interface CreateGatewayRoutePayload {
  name: string;
  slug: string;
  destinationUrl: string;
  method: GatewayHttpMethod;
  clientId: string;
  description?: string;
  timeoutMs?: number;
  retryCount?: number;
}

/** `clientId` is NOT editable — absent from `UpdateGatewayRouteDto` on the real backend. */
export type UpdateGatewayRoutePayload = Partial<Omit<CreateGatewayRoutePayload, 'clientId'>>;

export interface ChangeGatewayRouteStatusPayload {
  active: boolean;
}

export type GatewayRouteStatusFilter = 'all' | 'active' | 'inactive';
export type GatewayRouteMethodFilter = 'all' | GatewayHttpMethod;

/** Client picker option for the Gateway Routes filter bar / create form (reuses the Clients module). */
export interface GatewayRouteClientOption {
  id: string;
  name: string;
  code: string;
}

/** UI-only filter state for the Gateway Routes page — maps onto `FindGatewayRoutesParams`. */
export interface GatewayRoutesFilterState {
  search: string;
  client: GatewayRouteClientOption | null;
  method: GatewayRouteMethodFilter;
  status: GatewayRouteStatusFilter;
  sortBy: GatewayRouteSortBy;
  sortOrder: SortOrder;
  page: number;
}

/**
 * `GET /gateway-routes/clients-summary` — one aggregated row per client
 * (only clients with at least one route appear). No revoke concept here:
 * `total === active + inactive`.
 */
export interface GatewayRouteClientSummaryItem {
  client: ClientRef;
  total: number;
  active: number;
  inactive: number;
}

export type GatewayRouteClientsSummarySortBy = 'clientName' | 'total' | 'active' | 'inactive';

export interface FindGatewayRouteClientsSummaryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
  sortBy?: GatewayRouteClientsSummarySortBy;
  sortOrder?: SortOrder;
}

export type GatewayRouteClientsSummaryStatusFilter = 'all' | 'active' | 'inactive';

/** UI-only filter state for the Gateway Routes main (clients-summary) view. */
export interface GatewayRouteClientsSummaryFilterState {
  search: string;
  status: GatewayRouteClientsSummaryStatusFilter;
  sortBy: GatewayRouteClientsSummarySortBy;
  sortOrder: SortOrder;
  page: number;
}
