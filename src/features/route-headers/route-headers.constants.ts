import type {
  RouteHeadersFilterState,
  RouteHeaderSortBy,
} from '@/features/route-headers/route-headers.types';

export const ROUTE_HEADERS_PAGE_SIZE = 20;

export const ROUTE_HEADER_SORT_OPTIONS: RouteHeaderSortBy[] = [
  'headerName',
  'createdAt',
  'updatedAt',
];

export const MASKED_ROUTE_HEADER_VALUE = '********';

export const DEFAULT_ROUTE_HEADERS_FILTERS: RouteHeadersFilterState = {
  search: '',
  gatewayRoute: null,
  sensitive: 'all',
  status: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
};
