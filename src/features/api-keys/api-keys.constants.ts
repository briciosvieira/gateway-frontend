import type {
  ApiKeyClientsSummaryFilterState,
  ApiKeyClientsSummarySortBy,
  ApiKeySortBy,
  ApiKeysFilterState,
} from '@/features/api-keys/api-keys.types';

/** Matches the backend's default `limit` for `GET /api-keys`. */
export const API_KEYS_PAGE_SIZE = 20;

export const API_KEY_SORT_OPTIONS: ApiKeySortBy[] = [
  'name',
  'createdAt',
  'updatedAt',
  'expiresAt',
  'lastUsedAt',
];

export const DEFAULT_API_KEYS_FILTERS: ApiKeysFilterState = {
  search: '',
  client: null,
  status: 'all',
  onlyExpired: false,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
};

/** Matches the backend's default `limit` for `GET /api-keys/clients-summary`. */
export const API_KEY_CLIENTS_SUMMARY_PAGE_SIZE = 20;

export const API_KEY_CLIENTS_SUMMARY_SORT_OPTIONS: ApiKeyClientsSummarySortBy[] = [
  'clientName',
  'total',
  'active',
  'inactive',
  'revoked',
];

export const DEFAULT_API_KEY_CLIENTS_SUMMARY_FILTERS: ApiKeyClientsSummaryFilterState = {
  search: '',
  status: 'all',
  sortBy: 'clientName',
  sortOrder: 'asc',
  page: 1,
};
