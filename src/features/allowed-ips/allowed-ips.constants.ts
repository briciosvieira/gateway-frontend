import type {
  AllowedIpClientsSummaryFilterState,
  AllowedIpClientsSummarySortBy,
  AllowedIpsFilterState,
  AllowedIpSortBy,
  AllowedIpType,
} from '@/features/allowed-ips/allowed-ips.types';

/** Matches the backend's default `limit` for `GET /allowed-ips`. */
export const ALLOWED_IPS_PAGE_SIZE = 20;

export const ALLOWED_IP_SORT_OPTIONS: AllowedIpSortBy[] = ['address', 'createdAt', 'updatedAt'];

export const ALLOWED_IP_TYPES: AllowedIpType[] = ['IPV4', 'IPV6', 'CIDR_IPV4', 'CIDR_IPV6'];

export const DEFAULT_ALLOWED_IPS_FILTERS: AllowedIpsFilterState = {
  search: '',
  client: null,
  type: 'all',
  status: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
};

/** Matches the backend's default `limit` for `GET /allowed-ips/clients-summary`. */
export const ALLOWED_IP_CLIENTS_SUMMARY_PAGE_SIZE = 20;

export const ALLOWED_IP_CLIENTS_SUMMARY_SORT_OPTIONS: AllowedIpClientsSummarySortBy[] = [
  'clientName',
  'total',
  'active',
  'inactive',
];

export const DEFAULT_ALLOWED_IP_CLIENTS_SUMMARY_FILTERS: AllowedIpClientsSummaryFilterState = {
  search: '',
  status: 'all',
  sortBy: 'clientName',
  sortOrder: 'asc',
  page: 1,
};
