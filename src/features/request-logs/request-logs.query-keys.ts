import type { FindRequestLogsParams } from '@/features/request-logs/request-logs.types';

export const requestLogKeys = {
  all: ['request-logs'] as const,
  lists: () => [...requestLogKeys.all, 'list'] as const,
  list: (params: FindRequestLogsParams) => [...requestLogKeys.lists(), params] as const,
  details: () => [...requestLogKeys.all, 'detail'] as const,
  detail: (id: string) => [...requestLogKeys.details(), id] as const,
  byRequestIds: () => [...requestLogKeys.all, 'by-request-id'] as const,
  byRequestId: (requestId: string) => [...requestLogKeys.byRequestIds(), requestId] as const,
};
