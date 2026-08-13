import type {
  AuditAction,
  AuditEntity,
  AuditLogsFilterState,
} from '@/features/audit-logs/audit-logs.types';

export const AUDIT_LOGS_PAGE_SIZE = 20;

/** Background poll interval for the list query — new audit entries show up without a manual refresh. Shorter than the Dashboard's 60s (`DASHBOARD_REFETCH_INTERVAL`) since this is a live log view, not an aggregate. `keepPreviousData` (already set on the query) means each tick swaps in fresh rows with no loading flicker. */
export const AUDIT_LOGS_REFETCH_INTERVAL_MS = 15_000;

export const AUDIT_LOG_ACTIONS: AuditAction[] = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'ACTIVATE',
  'DEACTIVATE',
  'CHANGE_ROLE',
  'RESET_PASSWORD',
  'CHANGE_PASSWORD_REQUIREMENT',
  'LOGIN',
  'LOGOUT',
  'REFRESH_TOKEN',
  'REVOKE',
  'REGENERATE',
];

export const AUDIT_LOG_ENTITIES: AuditEntity[] = [
  'USER',
  'ROLE',
  'CLIENT',
  'API_KEY',
  'ALLOWED_IP',
  'GATEWAY_ROUTE',
  'ROUTE_HEADER',
  'SYSTEM_SETTING',
];

export const MASKED_AUDIT_VALUE = '********';

export const DEFAULT_AUDIT_LOG_FILTERS: AuditLogsFilterState = {
  search: '',
  action: 'all',
  entity: 'all',
  startDate: '',
  endDate: '',
  page: 1,
};
