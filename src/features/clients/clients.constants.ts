import type { ClientSortBy, ClientsFilterState } from '@/features/clients/clients.types';

/** Matches the backend's default `limit` for `GET /clients`. */
export const CLIENTS_PAGE_SIZE = 20;

export const CLIENT_SORT_OPTIONS: ClientSortBy[] = ['name', 'code', 'createdAt', 'updatedAt'];

export const DEFAULT_CLIENTS_FILTERS: ClientsFilterState = {
  search: '',
  status: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
};
