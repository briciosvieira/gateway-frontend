import type { FindAuditLogsParams } from '@/features/audit-logs/audit-logs.types';

export const auditLogKeys = {
  all: ['audit-logs'] as const,
  lists: () => [...auditLogKeys.all, 'list'] as const,
  list: (params: FindAuditLogsParams) => [...auditLogKeys.lists(), params] as const,
  details: () => [...auditLogKeys.all, 'detail'] as const,
  detail: (id: string) => [...auditLogKeys.details(), id] as const,
};
