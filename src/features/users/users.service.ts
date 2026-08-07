import type {
  AssignableRole,
  ChangePasswordRequirementPayload,
  ChangeUserRolePayload,
  ChangeUserStatusPayload,
  CreateUserPayload,
  CreateUserResult,
  ResetPasswordResult,
  UpdateUserPayload,
  UserListItem,
} from '@/features/users/users.types';
import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/types/api';

/** `GET /users` accepts no query params — see UsersViewFilters for why. */
export async function findUsers(signal?: AbortSignal): Promise<UserListItem[]> {
  const response = await apiClient.get<ApiSuccessResponse<UserListItem[]>>('/users', { signal });
  return response.data.data;
}

export async function findUserById(id: string, signal?: AbortSignal): Promise<UserListItem> {
  const response = await apiClient.get<ApiSuccessResponse<UserListItem>>(`/users/${id}`, {
    signal,
  });
  return response.data.data;
}

export async function createUser(payload: CreateUserPayload): Promise<CreateUserResult> {
  const response = await apiClient.post<ApiSuccessResponse<CreateUserResult>>('/users', payload);
  return response.data.data;
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<UserListItem> {
  const response = await apiClient.patch<ApiSuccessResponse<UserListItem>>(`/users/${id}`, payload);
  return response.data.data;
}

export async function changeUserRole(
  id: string,
  payload: ChangeUserRolePayload,
): Promise<UserListItem> {
  const response = await apiClient.patch<ApiSuccessResponse<UserListItem>>(
    `/users/${id}/role`,
    payload,
  );
  return response.data.data;
}

export async function changeUserStatus(
  id: string,
  payload: ChangeUserStatusPayload,
): Promise<UserListItem> {
  const response = await apiClient.patch<ApiSuccessResponse<UserListItem>>(
    `/users/${id}/status`,
    payload,
  );
  return response.data.data;
}

/** No request body — the backend always forces `firstLogin: true` on reset. */
export async function resetUserPassword(id: string): Promise<ResetPasswordResult> {
  const response = await apiClient.post<ApiSuccessResponse<ResetPasswordResult>>(
    `/users/${id}/reset-password`,
  );
  return response.data.data;
}

export async function changePasswordRequirement(
  id: string,
  payload: ChangePasswordRequirementPayload,
): Promise<UserListItem> {
  const response = await apiClient.patch<ApiSuccessResponse<UserListItem>>(
    `/users/${id}/password-requirement`,
    payload,
  );
  return response.data.data;
}

/**
 * ADMIN only. Backend returns 204 No Content. Fails with 403 if the caller
 * tries to delete themselves (`USER_CANNOT_DELETE_SELF`) or the last active
 * administrator (`LAST_ADMIN_CANNOT_BE_DELETED`) — both are backend-enforced
 * business rules, not predicted client-side.
 */
export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}

/** `GET /roles` — roles the *current* caller may assign, already filtered server-side. */
export async function findAssignableRoles(signal?: AbortSignal): Promise<AssignableRole[]> {
  const response = await apiClient.get<ApiSuccessResponse<AssignableRole[]>>('/roles', { signal });
  return response.data.data;
}
