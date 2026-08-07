import type {
  AuditAction,
  AuditEntity,
  AuditLogsFilterState,
} from '@/features/audit-logs/audit-logs.types';

export const AUDIT_LOGS_PAGE_SIZE = 20;

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
