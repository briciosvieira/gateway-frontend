import type { GatewayHttpMethod } from '@/features/gateway-routes/gateway-routes.types';

export type RequestOrigin = 'PUBLIC' | 'INTERNAL';
export type RequestLogResult = 'SUCCESS' | 'ERROR';
export type RequestLogSortBy =
  'attemptedAt' | 'createdAt' | 'durationMs' | 'statusCode' | 'attempts';
export type SortOrder = 'asc' | 'desc';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | { [key: string]: JsonValue } | JsonValue[];

export interface RequestLogClientRef {
  id: string;
  name: string;
  code: string;
}

export interface RequestLogApiKeyRef {
  id: string;
  name: string;
}

export interface RequestLogGatewayRouteRef {
  id: string;
  name: string;
  slug: string;
  method: GatewayHttpMethod;
}

export interface RequestLogListItem {
  id: string;
  requestId: string;
  /**
   * The real instant the request attempt entered the Gateway — always
   * present (`NOT NULL` in the database; historical rows were backfilled
   * with `attemptedAt = createdAt`). This is the sole source for the
   * "Horário" column and for date-range filtering; `createdAt` is only the
   * persistence timestamp and is never used as a fallback.
   */
  attemptedAt: string;
  requestOrigin: RequestOrigin | null;
  sourceHost: string | null;
  clientId: string | null;
  apiKeyId: string | null;
  gatewayRouteId: string | null;
  sourceIp: string;
  method: GatewayHttpMethod;
  publicPath: string;
  publicEndpoint: string | null;
  destinationHost: string | null;
  destinationIp: string | null;
  statusCode: number;
  durationMs: number;
  attempts: number;
  result: RequestLogResult;
  errorCode: string | null;
  errorMessage: string | null;
  requestSizeBytes: number | null;
  responseSizeBytes: number | null;
  createdAt: string;
  client: RequestLogClientRef | null;
  apiKey: RequestLogApiKeyRef | null;
  gatewayRoute: RequestLogGatewayRouteRef | null;
}

export interface RequestLog extends RequestLogListItem {
  destinationUrl: string | null;
  upstreamStatusCode: number | null;
  requestHeaders: JsonValue | null;
  requestQuery: JsonValue | null;
  requestBody: JsonValue | null;
  responseHeaders: JsonValue | null;
  responseBody: JsonValue | null;
}

export interface FindRequestLogsParams {
  page?: number;
  limit?: number;
  search?: string;
  clientId?: string;
  apiKeyId?: string;
  gatewayRouteId?: string;
  sourceIp?: string;
  requestOrigin?: RequestOrigin;
  destinationHost?: string;
  destinationIp?: string;
  method?: GatewayHttpMethod;
  statusCode?: number;
  result?: RequestLogResult;
  errorCode?: string;
  requestId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: RequestLogSortBy;
  sortOrder?: SortOrder;
}

export interface RequestLogClientOption {
  id: string;
  name: string;
  code: string;
}

export interface RequestLogApiKeyOption {
  id: string;
  name: string;
  prefix: string;
}

export interface RequestLogGatewayRouteOption {
  id: string;
  name: string;
  slug: string;
  method: GatewayHttpMethod;
}

export type RequestOriginFilter = 'all' | RequestOrigin;
export type RequestLogResultFilter = 'all' | RequestLogResult;
export type RequestLogMethodFilter = 'all' | GatewayHttpMethod;

export interface RequestLogsFilterState {
  search: string;
  requestOrigin: RequestOriginFilter;
  method: RequestLogMethodFilter;
  statusCode: string;
  result: RequestLogResultFilter;
  /** Selected day, `YYYY-MM-DD` (raw `<input type="date">` value) — converted to a local-day-boundary ISO instant only when building query params. */
  startDate: string;
  /** Selected day, `YYYY-MM-DD` (raw `<input type="date">` value) — converted to a local-day-boundary ISO instant only when building query params. */
  endDate: string;
  /** Real backend sort field. Defaults to `'attemptedAt'` — never `'createdAt'`. */
  sortBy: RequestLogSortBy;
  sortOrder: SortOrder;
  page: number;
}
