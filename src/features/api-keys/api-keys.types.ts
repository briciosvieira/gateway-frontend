import type { ClientRef } from '@/features/clients/clients.types';

/** Nested client reference returned inside every API key response (`apiKeySelect`). */
export type ApiKeyClientRef = ClientRef;

/**
 * Mirrors the backend's `apiKeySelect` exactly
 * (src/modules/api-keys/api-keys.service.ts) — the plaintext key/secret is
 * never included here; it only ever appears once, in
 * `CreateApiKeyResult`/`RegenerateApiKeyResult`.
 */
export interface ApiKey {
  id: string;
  clientId: string;
  name: string;
  prefix: string;
  active: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
  client: ApiKeyClientRef;
}

export type ApiKeySortBy = 'name' | 'createdAt' | 'updatedAt' | 'expiresAt' | 'lastUsedAt';
export type SortOrder = 'asc' | 'desc';

/**
 * Exact query params accepted by `GET /api-keys` (confirmed against
 * backend source). There is no `revoked` boolean filter — revocation can
 * only be read per-item (`revokedAt !== null`), never filtered server-side.
 * `expiresFrom`/`expiresTo` is a date range, not an `expired` boolean — the
 * UI derives an "only expired" filter by sending `expiresTo: now`.
 */
export interface FindApiKeysParams {
  page?: number;
  limit?: number;
  search?: string;
  clientId?: string;
  prefix?: string;
  active?: boolean;
  expiresFrom?: string;
  expiresTo?: string;
  sortBy?: ApiKeySortBy;
  sortOrder?: SortOrder;
}

export interface CreateApiKeyPayload {
  name: string;
  clientId: string;
  expiresAt?: string;
}

export interface UpdateApiKeyPayload {
  name?: string;
  expiresAt?: string;
}

export interface ChangeApiKeyStatusPayload {
  active: boolean;
}

export interface RegenerateApiKeyPayload {
  revokePrevious?: boolean;
}

/** `POST /api-keys` response — `key` is the plaintext value, shown exactly once. */
export interface CreateApiKeyResult {
  apiKey: ApiKey;
  key: string;
  warning: string;
}

/** `POST /api-keys/:id/regenerate` response — same one-time-reveal shape, plus a revoke flag. */
export interface RegenerateApiKeyResult {
  apiKey: ApiKey;
  key: string;
  previousApiKeyRevoked: boolean;
  warning: string;
}

export type ApiKeyStatusFilter = 'all' | 'active' | 'inactive';

/** Client picker option for the API Keys filter bar / create form (reuses the Clients module). */
export interface ApiKeyClientOption {
  id: string;
  name: string;
  code: string;
}

/** UI-only filter state for the API Keys page — maps onto `FindApiKeysParams`. */
export interface ApiKeysFilterState {
  search: string;
  client: ApiKeyClientOption | null;
  status: ApiKeyStatusFilter;
  onlyExpired: boolean;
  sortBy: ApiKeySortBy;
  sortOrder: SortOrder;
  page: number;
}

/**
 * `GET /api-keys/clients-summary` — one aggregated row per client (only
 * clients with at least one API Key appear). Backend-confirmed contract
 * (2026-08-07): `active` excludes revoked and expired keys; `revoked` is a
 * disjoint bucket; `total === active + inactive + revoked`.
 */
export interface ApiKeyClientSummaryItem {
  client: ClientRef;
  total: number;
  active: number;
  inactive: number;
  revoked: number;
}

export type ApiKeyClientsSummarySortBy = 'clientName' | 'total' | 'active' | 'inactive' | 'revoked';

export interface FindApiKeyClientsSummaryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
  sortBy?: ApiKeyClientsSummarySortBy;
  sortOrder?: SortOrder;
}

export type ApiKeyClientsSummaryStatusFilter = 'all' | 'active' | 'inactive';

/** UI-only filter state for the API Keys main (clients-summary) view. */
export interface ApiKeyClientsSummaryFilterState {
  search: string;
  status: ApiKeyClientsSummaryStatusFilter;
  sortBy: ApiKeyClientsSummarySortBy;
  sortOrder: SortOrder;
  page: number;
}
