import type { RoleCode, RoleDetails } from '@/features/auth/auth.types';

/**
 * Mirrors the backend's `userSelect` exactly
 * (src/modules/users/users.service.ts) — no `passwordHash`/refresh token is
 * ever returned by any endpoint, so there is nothing to redact here.
 */
export interface UserListItem {
  id: string;
  name: string;
  username: string;
  email: string;
  active: boolean;
  firstLogin: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  role: RoleDetails;
}

/**
 * `GET /roles` — the roles the *current* caller is allowed to assign, not a
 * generic role catalog (ADMIN sees all four, OPERATOR never sees ADMIN).
 */
export interface AssignableRole {
  id: string;
  code: RoleCode;
  name: string;
  description: string | null;
  level: number;
}

export interface CreateUserPayload {
  name: string;
  username: string;
  email: string;
  roleId: string;
  requirePasswordChange?: boolean;
}

export interface CreateUserResult {
  user: UserListItem;
  temporaryPassword: string;
  passwordMustBeChanged: boolean;
}

export interface UpdateUserPayload {
  name?: string;
  username?: string;
  email?: string;
}

export interface ChangeUserRolePayload {
  roleId: string;
}

export interface ChangeUserStatusPayload {
  active: boolean;
}

export interface ChangePasswordRequirementPayload {
  requirePasswordChange: boolean;
}

/** `POST /users/:id/reset-password` never returns the updated user, only this. */
export interface ResetPasswordResult {
  temporaryPassword: string;
  passwordMustBeChanged: boolean;
}

export type UserStatusFilter = 'all' | 'active' | 'inactive';
export type UserFirstLoginFilter = 'all' | 'pending' | 'completed';
export type UserSortBy = 'name' | 'username' | 'email' | 'createdAt' | 'lastLoginAt';
export type SortOrder = 'asc' | 'desc';

/**
 * `GET /users` has no query params at all (confirmed against backend
 * source: bare array, no pagination/search/filter/sort) — every field below
 * is applied client-side, over the single already-fetched full list. This
 * is safe here (unlike the Dashboard's pre-aggregated endpoints) because
 * the backend already returns every user the caller can see; slicing that
 * same data in the browser doesn't misrepresent anything.
 */
export interface UsersViewFilters {
  search: string;
  role: RoleCode | 'all';
  status: UserStatusFilter;
  firstLogin: UserFirstLoginFilter;
  sortBy: UserSortBy;
  sortOrder: SortOrder;
  page: number;
}
