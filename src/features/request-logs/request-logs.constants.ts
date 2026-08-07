import type {
  RequestLogMethodFilter,
  RequestLogsFilterState,
  RequestLogResult,
  RequestLogSortBy,
  RequestOrigin,
} from '@/features/request-logs/request-logs.types';

export const REQUEST_LOGS_PAGE_SIZE = 20;
export const MASKED_REQUEST_LOG_VALUE = '********';

export const REQUEST_LOG_ORIGINS: RequestOrigin[] = ['PUBLIC', 'INTERNAL'];
export const REQUEST_LOG_RESULTS: RequestLogResult[] = ['SUCCESS', 'ERROR'];
export const REQUEST_LOG_METHODS: Exclude<RequestLogMethodFilter, 'all'>[] = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
];
export const REQUEST_LOG_SORT_FIELDS: RequestLogSortBy[] = [
  'attemptedAt',
  'createdAt',
  'durationMs',
  'statusCode',
  'attempts',
];

/** The subset of `REQUEST_LOG_SORT_FIELDS` exposed in the "Ordenar por" filter — `'attempts'` is a real backend field but was not requested as a user-facing sort option. */
export const REQUEST_LOG_SORT_OPTIONS: RequestLogSortBy[] = [
  'attemptedAt',
  'durationMs',
  'statusCode',
  'createdAt',
];

export const DEFAULT_REQUEST_LOG_FILTERS: RequestLogsFilterState = {
  search: '',
  requestOrigin: 'all',
  method: 'all',
  statusCode: '',
  result: 'all',
  startDate: '',
  endDate: '',
  sortBy: 'attemptedAt',
  sortOrder: 'desc',
  page: 1,
};
