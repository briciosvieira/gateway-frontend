import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  changePasswordRequirement,
  changeUserRole,
  changeUserStatus,
  createUser,
  deleteUser,
  findAssignableRoles,
  findUserById,
  findUsers,
  resetUserPassword,
  updateUser,
} from '@/features/users/users.service';
import type {
  ChangePasswordRequirementPayload,
  ChangeUserRolePayload,
  ChangeUserStatusPayload,
  CreateUserPayload,
  UpdateUserPayload,
} from '@/features/users/users.types';
import { isApiError } from '@/lib/api/api-error';

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

export const roleKeys = {
  all: ['roles'] as const,
  assignable: () => [...roleKeys.all, 'assignable'] as const,
};

/** Only retries on 5xx responses, up to twice — never on 4xx or network errors. */
function usersRetry(failureCount: number, error: unknown): boolean {
  if (!isApiError(error)) return false;
  return error.statusCode >= 500 && failureCount < 2;
}

export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: ({ signal }) => findUsers(signal),
    staleTime: 30_000,
    retry: usersRetry,
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: userKeys.detail(id ?? ''),
    queryFn: ({ signal }) => findUserById(id ?? '', signal),
    enabled: Boolean(id),
    retry: usersRetry,
  });
}

export function useAssignableRoles() {
  return useQuery({
    queryKey: roleKeys.assignable(),
    queryFn: ({ signal }) => findAssignableRoles(signal),
    staleTime: 60_000,
    retry: usersRetry,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateUserPayload) => updateUser(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}

export function useChangeUserRole(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangeUserRolePayload) => changeUserRole(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}

export function useChangeUserStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangeUserStatusPayload) => changeUserStatus(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}

export function useResetUserPassword(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => resetUserPassword(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}

export function useChangePasswordRequirement(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangePasswordRequirementPayload) =>
      changePasswordRequirement(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}

export function useDeleteUser(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteUser(id),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.removeQueries({ queryKey: userKeys.detail(id) });
    },
    onError: (error) => {
      if (isApiError(error) && error.statusCode === 404) {
        void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      }
    },
  });
}
