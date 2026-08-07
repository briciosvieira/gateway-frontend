import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  changeApiKeyStatus,
  createApiKey,
  deleteApiKey,
  findApiKeyById,
  findApiKeyClientsSummary,
  findApiKeys,
  regenerateApiKey,
  revokeApiKey,
  updateApiKey,
} from '@/features/api-keys/api-keys.service';
import type {
  ChangeApiKeyStatusPayload,
  CreateApiKeyPayload,
  FindApiKeyClientsSummaryParams,
  FindApiKeysParams,
  RegenerateApiKeyPayload,
  UpdateApiKeyPayload,
} from '@/features/api-keys/api-keys.types';
import { findClients } from '@/features/clients/clients.service';
import { isApiError } from '@/lib/api/api-error';

export const apiKeyKeys = {
  all: ['api-keys'] as const,
  lists: () => [...apiKeyKeys.all, 'list'] as const,
  list: (params: FindApiKeysParams) => [...apiKeyKeys.lists(), params] as const,
  details: () => [...apiKeyKeys.all, 'detail'] as const,
  detail: (id: string) => [...apiKeyKeys.details(), id] as const,
};

export const apiKeyClientsSummaryKeys = {
  all: ['api-keys', 'clients-summary'] as const,
  lists: () => [...apiKeyClientsSummaryKeys.all, 'list'] as const,
  list: (params: FindApiKeyClientsSummaryParams) =>
    [...apiKeyClientsSummaryKeys.lists(), params] as const,
};

/**
 * Invalidated by every API Key mutation (create/update/status/revoke/
 * regenerate/delete) alongside the resource's own query keys — any of these
 * can change a client's aggregate counts (e.g. `expiresAt` edits can flip a
 * key's "active" bucket) so the main clients-summary view stays in sync
 * without a page reload.
 */
function invalidateApiKeyClientsSummary(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: apiKeyClientsSummaryKeys.lists() });
}

/** Only retries on 5xx responses, up to twice — never on 4xx or network errors. */
function apiKeysRetry(failureCount: number, error: unknown): boolean {
  if (!isApiError(error)) return false;
  return error.statusCode >= 500 && failureCount < 2;
}

export function useApiKeys(params: FindApiKeysParams) {
  return useQuery({
    queryKey: apiKeyKeys.list(params),
    queryFn: ({ signal }) => findApiKeys(params, signal),
    staleTime: 30_000,
    retry: apiKeysRetry,
    // Keeps the current page's rows on screen while the next page loads.
    placeholderData: keepPreviousData,
  });
}

export function useApiKeyClientsSummary(params: FindApiKeyClientsSummaryParams) {
  return useQuery({
    queryKey: apiKeyClientsSummaryKeys.list(params),
    queryFn: ({ signal }) => findApiKeyClientsSummary(params, signal),
    staleTime: 30_000,
    retry: apiKeysRetry,
    // Keeps the current page's rows on screen while the next page loads.
    placeholderData: keepPreviousData,
  });
}

export function useApiKey(id: string | undefined) {
  return useQuery({
    queryKey: apiKeyKeys.detail(id ?? ''),
    queryFn: ({ signal }) => findApiKeyById(id ?? '', signal),
    enabled: Boolean(id),
    retry: apiKeysRetry,
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateApiKeyPayload) => createApiKey(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: apiKeyKeys.lists() });
      invalidateApiKeyClientsSummary(queryClient);
    },
  });
}

export function useUpdateApiKey(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateApiKeyPayload) => updateApiKey(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: apiKeyKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: apiKeyKeys.detail(id) });
      invalidateApiKeyClientsSummary(queryClient);
    },
  });
}

export function useChangeApiKeyStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangeApiKeyStatusPayload) => changeApiKeyStatus(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: apiKeyKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: apiKeyKeys.detail(id) });
      invalidateApiKeyClientsSummary(queryClient);
    },
  });
}

export function useRevokeApiKey(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => revokeApiKey(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: apiKeyKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: apiKeyKeys.detail(id) });
      invalidateApiKeyClientsSummary(queryClient);
    },
  });
}

export function useRegenerateApiKey(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegenerateApiKeyPayload) => regenerateApiKey(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: apiKeyKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: apiKeyKeys.detail(id) });
      invalidateApiKeyClientsSummary(queryClient);
    },
  });
}

export function useDeleteApiKey(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteApiKey(id),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: apiKeyKeys.lists() });
      queryClient.removeQueries({ queryKey: apiKeyKeys.detail(id) });
      invalidateApiKeyClientsSummary(queryClient);
    },
    onError: (error) => {
      if (isApiError(error) && error.statusCode === 404) {
        void queryClient.invalidateQueries({ queryKey: apiKeyKeys.lists() });
        invalidateApiKeyClientsSummary(queryClient);
      }
    },
  });
}

/**
 * Populates the client combobox in the API Keys filter bar and create form.
 * Reuses the real Clients module (`GET /clients?search=&limit=`) — an API
 * key's `clientId` must reference a real client, and `clients.service.ts`
 * already implements exactly this lookup, so it's reused rather than
 * duplicated (same pattern as the Dashboard's client combobox in Etapa 5).
 */
export function useApiKeyClientOptions(search: string, enabled: boolean) {
  return useQuery({
    queryKey: ['api-keys', 'client-options', search],
    queryFn: ({ signal }) => findClients({ search, limit: 10 }, signal),
    select: (data) => data.items,
    enabled,
    staleTime: 30_000,
  });
}
