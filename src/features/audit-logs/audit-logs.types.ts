import type { RoleCode } from '@/features/auth/auth.types';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'ACTIVATE'
  | 'DEACTIVATE'
  | 'CHANGE_ROLE'
  | 'RESET_PASSWORD'
  | 'CHANGE_PASSWORD_REQUIREMENT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'REFRESH_TOKEN'
  | 'REVOKE'
  | 'REGENERATE';

export type AuditEntity =
  | 'USER'
  | 'ROLE'
  | 'CLIENT'
  | 'API_KEY'
  | 'ALLOWED_IP'
  | 'GATEWAY_ROUTE'
  | 'ROUTE_HEADER'
  | 'SYSTEM_SETTING';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | { [key: string]: JsonValue } | JsonValue[];

export interface AuditLogUserRole {
  code: RoleCode;
  name: string;
}

export interface AuditLogUser {
  id: string;
  name: string;
  username: string;
  email?: string;
  role: AuditLogUserRole;
}

export interface AuditLog {
  id: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string | null;
  previousValue: JsonValue | null;
  newValue: JsonValue | null;
  sourceIp: string | null;
  requestId: string | null;
  description: string | null;
  createdAt: string;
  user: AuditLogUser | null;
}

export type AuditLogListItem = AuditLog;

export interface FindAuditLogsParams {
  page?: number;
  limit?: number;
  action?: AuditAction;
  entity?: AuditEntity;
  userId?: string;
  entityId?: string;
  requestId?: string;
  startDate?: string;
  endDate?: string;
}

export type AuditActionFilter = 'all' | AuditAction;
export type AuditEntityFilter = 'all' | AuditEntity;

export interface AuditLogsFilterState {
  search: string;
  action: AuditActionFilter;
  entity: AuditEntityFilter;
  startDate: string;
  endDate: string;
  page: number;
}
