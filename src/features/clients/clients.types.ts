/**
 * Mirrors the backend's `clientSelect` exactly
 * (src/modules/clients/clients.service.ts) — every endpoint (list item,
 * create, get-by-id, update, status change) returns exactly these 9
 * fields, nothing more.
 */
export interface Client {
  id: string;
  name: string;
  code: string;
  description: string | null;
  contactName: string | null;
  contactEmail: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Same shape as `Client` — the backend has no separate list-item projection. */
export type ClientListItem = Client;

/** Minimal client reference shape embedded in per-resource records and the `clients-summary` aggregate endpoints. */
export type ClientRef = Pick<Client, 'id' | 'name' | 'code' | 'active'>;

export type ClientSortBy = 'name' | 'code' | 'createdAt' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

/** Exact query params accepted by `GET /clients` (confirmed against backend source). */
export interface FindClientsParams {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
  sortBy?: ClientSortBy;
  sortOrder?: SortOrder;
}

/**
 * `code` is intentionally absent — the backend generates it automatically
 * from `name` (`CreateClientDto` has no `code` field, it can never be set
 * by the caller). The frontend only shows a live preview of what it will
 * likely be; the authoritative value always comes back in the response.
 */
export interface CreateClientPayload {
  name: string;
  description?: string;
  contactName?: string;
  contactEmail?: string;
}

/** All fields optional — `PATCH /clients/:id` has no `active` field (see `ChangeClientStatusPayload`). */
export type UpdateClientPayload = Partial<CreateClientPayload>;

export interface ChangeClientStatusPayload {
  active: boolean;
}

export type ClientStatusFilter = 'all' | 'active' | 'inactive';

/** UI-only filter state for the Clients page — maps 1:1 onto `FindClientsParams`. */
export interface ClientsFilterState {
  search: string;
  status: ClientStatusFilter;
  sortBy: ClientSortBy;
  sortOrder: SortOrder;
  page: number;
}
