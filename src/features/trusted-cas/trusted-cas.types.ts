/**
 * Mirrors the backend's `trustedCaPublicSelect` exactly
 * (src/modules/trusted-cas/trusted-cas.service.ts) — `certificatePem` is
 * NEVER part of this select and therefore never returned by any endpoint.
 * The frontend must never render a `certificatePem`/`pem`/`rawCertificate`
 * field even if one appears on a response by mistake.
 */
export interface TrustedCa {
  id: string;
  name: string;
  fingerprintSha256: string;
  subject: string;
  issuer: string;
  serialNumber: string;
  validFrom: string;
  validTo: string;
  /** `true` when `subject === issuer` (self-signed root) — computed server-side, never client-derived. */
  isRoot: boolean;
  active: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export type TrustedCaListItem = TrustedCa;

export type TrustedCaSortBy = 'name' | 'validTo' | 'createdAt' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

/** Exact backend enum (`TrustedCaValidityFilter`) — only two values, no "expiring" filter exists server-side. */
export type TrustedCaValidity = 'valid' | 'expired';

/** Exact query params accepted by `GET /trusted-cas` (confirmed against backend source). */
export interface FindTrustedCasParams {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
  validity?: TrustedCaValidity;
  sortBy?: TrustedCaSortBy;
  sortOrder?: SortOrder;
}

/**
 * `POST /trusted-cas` is multipart/form-data — this is not a JSON payload.
 * Field names (`name`, `file`) match the real backend DTO exactly; `file`
 * is a browser `File`, never converted to base64/JSON.
 */
export interface CreateTrustedCaPayload {
  name: string;
  file: File;
}

export interface ChangeTrustedCaStatusPayload {
  active: boolean;
}

export type TrustedCaStatusFilter = 'all' | 'active' | 'inactive';
/** UI filter state adds `'all'` on top of the real `TrustedCaValidity` enum. */
export type TrustedCaValidityFilter = 'all' | TrustedCaValidity;

/** UI-only filter state for the Certificates page — maps onto `FindTrustedCasParams`. */
export interface TrustedCasFilterState {
  search: string;
  status: TrustedCaStatusFilter;
  validity: TrustedCaValidityFilter;
  sortBy: TrustedCaSortBy;
  sortOrder: SortOrder;
  page: number;
}
