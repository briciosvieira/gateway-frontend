import type { ClientRef } from '@/features/clients/clients.types';

/** Nested client reference returned inside every allowed-ip response (`allowedIpSelect`). */
export type AllowedIpClientRef = ClientRef;

export type AllowedIpType = 'IPV4' | 'IPV6' | 'CIDR_IPV4' | 'CIDR_IPV6';

/**
 * Mirrors the backend's `allowedIpSelect` exactly
 * (src/modules/allowed-ips/allowed-ips.service.ts). `type` is derived
 * server-side from `address` — never client-supplied, never editable.
 */
export interface AllowedIp {
  id: string;
  clientId: string;
  address: string;
  type: AllowedIpType;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  client: AllowedIpClientRef;
}

export type AllowedIpSortBy = 'address' | 'createdAt' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

/** Exact query params accepted by `GET /allowed-ips` (confirmed against backend source). */
export interface FindAllowedIpsParams {
  page?: number;
  limit?: number;
  search?: string;
  clientId?: string;
  type?: AllowedIpType;
  active?: boolean;
  sortBy?: AllowedIpSortBy;
  sortOrder?: SortOrder;
}

export interface CreateAllowedIpPayload {
  address: string;
  clientId: string;
  description?: string;
}

/** `clientId` is NOT editable — absent from `UpdateAllowedIpDto` on the real backend. */
export interface UpdateAllowedIpPayload {
  address?: string;
  description?: string;
}

export interface ChangeAllowedIpStatusPayload {
  active: boolean;
}

export type AllowedIpStatusFilter = 'all' | 'active' | 'inactive';
export type AllowedIpTypeFilter = 'all' | AllowedIpType;

/** Client picker option for the Allowed IPs filter bar / create form (reuses the Clients module). */
export interface AllowedIpClientOption {
  id: string;
  name: string;
  code: string;
}

/** UI-only filter state for the Allowed IPs page — maps onto `FindAllowedIpsParams`. */
export interface AllowedIpsFilterState {
  search: string;
  client: AllowedIpClientOption | null;
  type: AllowedIpTypeFilter;
  status: AllowedIpStatusFilter;
  sortBy: AllowedIpSortBy;
  sortOrder: SortOrder;
  page: number;
}

/**
 * `GET /allowed-ips/clients-summary` — one aggregated row per client (only
 * clients with at least one Allowed IP appear). No revoke concept here,
 * unlike API Keys: `total === active + inactive`.
 */
export interface AllowedIpClientSummaryItem {
  client: ClientRef;
  total: number;
  active: number;
  inactive: number;
}

export type AllowedIpClientsSummarySortBy = 'clientName' | 'total' | 'active' | 'inactive';

export interface FindAllowedIpClientsSummaryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
  sortBy?: AllowedIpClientsSummarySortBy;
  sortOrder?: SortOrder;
}

export type AllowedIpClientsSummaryStatusFilter = 'all' | 'active' | 'inactive';

/** UI-only filter state for the Allowed IPs main (clients-summary) view. */
export interface AllowedIpClientsSummaryFilterState {
  search: string;
  status: AllowedIpClientsSummaryStatusFilter;
  sortBy: AllowedIpClientsSummarySortBy;
  sortOrder: SortOrder;
  page: number;
}
