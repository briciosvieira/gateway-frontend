import type { AuthenticatedUser, RoleCode } from '@/features/auth/auth.types';
import type { UserListItem } from '@/features/users/users.types';

/**
 * UI-only hints mirroring `src/modules/users/policies/user-creation.policy.ts`
 * on the real backend: ADMIN can manage/assign any role; OPERATOR can manage
 * any target and assign any role except ADMIN. These are not a security
 * boundary — the backend re-checks every request and is the sole authority
 * (see role-permissions.ts). Used only to disable/hide actions that would
 * otherwise get a guaranteed 403.
 */
export function canManageTargetRole(currentUserRole: RoleCode, targetRole: RoleCode): boolean {
  if (currentUserRole === 'ADMIN') return true;
  if (currentUserRole === 'OPERATOR') return targetRole !== 'ADMIN';
  return false;
}

export function canAssignRole(currentUserRole: RoleCode, newRole: RoleCode): boolean {
  return canManageTargetRole(currentUserRole, newRole);
}

/** Mirrors the backend's self-deactivation guard on `PATCH /users/:id/status`. */
export function canDeactivate(currentUser: AuthenticatedUser, target: UserListItem): boolean {
  return currentUser.id !== target.id;
}

/** Mirrors the backend's self-demotion guard on `PATCH /users/:id/role`. */
export function canChangeOwnAdminRole(
  currentUser: AuthenticatedUser,
  target: UserListItem,
): boolean {
  if (currentUser.id !== target.id) return true;
  return target.role.code !== 'ADMIN';
}

/**
 * UI-only hint for `DELETE /users/:id`: never offer self-delete. The
 * backend's own `USER_CANNOT_DELETE_SELF`/`LAST_ADMIN_CANNOT_BE_DELETED`
 * guards remain the sole authority — this only avoids a guaranteed 403 for
 * the one case that's cheap and safe to predict client-side; the "last
 * active admin" rule is deliberately NOT predicted here.
 */
export function canDeleteUser(currentUser: AuthenticatedUser, target: UserListItem): boolean {
  return currentUser.id !== target.id;
}
