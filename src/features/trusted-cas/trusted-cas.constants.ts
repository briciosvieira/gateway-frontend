import type {
  TrustedCaSortBy,
  TrustedCasFilterState,
} from '@/features/trusted-cas/trusted-cas.types';

/** Matches the backend's default `limit` for `GET /trusted-cas`. */
export const TRUSTED_CAS_PAGE_SIZE = 20;

export const TRUSTED_CA_SORT_OPTIONS: TrustedCaSortBy[] = [
  'name',
  'validTo',
  'createdAt',
  'updatedAt',
];

/**
 * Visually accepted formats — matches `ALLOWED_CERTIFICATE_EXTENSIONS` in
 * the backend's `trusted-ca-certificate.util.ts` exactly. This is only a
 * UI hint (the file picker `accept` attribute and a fast client-side
 * check); the backend remains the sole authority on the actual file
 * content.
 */
export const TRUSTED_CA_ACCEPTED_EXTENSIONS = ['.pem', '.crt', '.cer'];
export const TRUSTED_CA_ACCEPT_ATTRIBUTE = TRUSTED_CA_ACCEPTED_EXTENSIONS.join(',');

/**
 * Extensions the backend explicitly rejects as private keys/PKCS#12
 * bundles (`BLOCKED_CERTIFICATE_EXTENSIONS`) — used only to show a fast,
 * specific client-side message instead of a generic "unsupported format"
 * one for this common mistake.
 */
export const TRUSTED_CA_BLOCKED_EXTENSIONS = ['.key', '.pfx', '.p12'];

/** Visual-only threshold for the "expiring soon" badge state — never sent to the backend, never changes `active`. */
export const CERTIFICATE_EXPIRING_SOON_DAYS = 30;

export const DEFAULT_TRUSTED_CAS_FILTERS: TrustedCasFilterState = {
  search: '',
  status: 'all',
  validity: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
};
