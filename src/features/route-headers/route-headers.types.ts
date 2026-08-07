import type {
  GatewayHttpMethod,
  GatewayRoute,
  GatewayRouteClientRef,
} from '@/features/gateway-routes/gateway-routes.types';

export interface RouteHeader {
  id: string;
  gatewayRouteId: string;
  name: string;
  value: string;
  sensitive: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RouteHeaderListItem = RouteHeader;

export type RouteHeaderSortBy = 'headerName' | 'createdAt' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

export interface FindRouteHeadersParams {
  page?: number;
  limit?: number;
  search?: string;
  gatewayRouteId?: string;
  headerName?: string;
  active?: boolean;
  sensitive?: boolean;
  sortBy?: RouteHeaderSortBy;
  sortOrder?: SortOrder;
}

export interface CreateRouteHeaderPayload {
  gatewayRouteId: string;
  name: string;
  value: string;
  sensitive?: boolean;
}

export type UpdateRouteHeaderPayload = Partial<Omit<CreateRouteHeaderPayload, 'gatewayRouteId'>>;

export interface ChangeRouteHeaderStatusPayload {
  active: boolean;
}

export type RouteHeaderStatusFilter = 'all' | 'active' | 'inactive';
export type RouteHeaderSensitiveFilter = 'all' | 'sensitive' | 'notSensitive';

export interface RouteHeaderGatewayRouteOption {
  id: string;
  name: string;
  method: GatewayHttpMethod;
  publicPath: string;
  client: GatewayRouteClientRef;
}

export interface RouteHeadersFilterState {
  search: string;
  gatewayRoute: RouteHeaderGatewayRouteOption | null;
  sensitive: RouteHeaderSensitiveFilter;
  status: RouteHeaderStatusFilter;
  sortBy: RouteHeaderSortBy;
  sortOrder: SortOrder;
  page: number;
}

export function toRouteHeaderGatewayRouteOption(
  route: GatewayRoute,
): RouteHeaderGatewayRouteOption {
  return {
    id: route.id,
    name: route.name,
    method: route.method,
    publicPath: route.publicPath,
    client: route.client,
  };
}
