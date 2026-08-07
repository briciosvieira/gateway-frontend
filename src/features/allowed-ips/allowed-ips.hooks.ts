import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  changeAllowedIpStatus,
  createAllowedIp,
  deleteAllowedIp,
  findAllowedIpById,
  findAllowedIpClientsSummary,
  findAllowedIps,
  updateAllowedIp,
} from '@/features/allowed-ips/allowed-ips.service';
import type {
  ChangeAllowedIpStatusPayload,
  CreateAllowedIpPayload,
  FindAllowedIpClientsSummaryParams,
  FindAllowedIpsParams,
  UpdateAllowedIpPayload,
} from '@/features/allowed-ips/allowed-ips.types';
import { findClients } from '@/features/clients/clients.service';
import { isApiError } from '@/lib/api/api-error';

export const allowedIpKeys = {
  all: ['allowed-ips'] as const,
  lists: () => [...allowedIpKeys.all, 'list'] as const,
  list: (params: FindAllowedIpsParams) => [...allowedIpKeys.lists(), params] as const,
  details: () => [...allowedIpKeys.all, 'detail'] as const,
  detail: (id: string) => [...allowedIpKeys.details(), id] as const,
};

export const allowedIpClientsSummaryKeys = {
  all: ['allowed-ips', 'clients-summary'] as const,
  lists: () => [...allowedIpClientsSummaryKeys.all, 'list'] as const,
  list: (params: FindAllowedIpClientsSummaryParams) =>
    [...allowedIpClientsSummaryKeys.lists(), params] as const,
};

/** Invalidated by every Allowed IP mutation alongside the resource's own query keys, keeping the main clients-summary view in sync. */
function invalidateAllowedIpClientsSummary(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: allowedIpClientsSummaryKeys.lists() });
}

/** Only retries on 5xx responses, up to twice — never on 4xx or network errors. */
function allowedIpsRetry(failureCount: number, error: unknown): boolean {
  if (!isApiError(error)) return false;
  return error.statusCode >= 500 && failureCount < 2;
}

export function useAllowedIps(params: FindAllowedIpsParams) {
  return useQuery({
    queryKey: allowedIpKeys.list(params),
    queryFn: ({ signal }) => findAllowedIps(params, signal),
    staleTime: 30_000,
    retry: allowedIpsRetry,
    // Keeps the current page's rows on screen while the next page loads.
    placeholderData: keepPreviousData,
  });
}

export function useAllowedIpClientsSummary(params: FindAllowedIpClientsSummaryParams) {
  return useQuery({
    queryKey: allowedIpClientsSummaryKeys.list(params),
    queryFn: ({ signal }) => findAllowedIpClientsSummary(params, signal),
    staleTime: 30_000,
    retry: allowedIpsRetry,
    // Keeps the current page's rows on screen while the next page loads.
    placeholderData: keepPreviousData,
  });
}

export function useAllowedIp(id: string | undefined) {
  return useQuery({
    queryKey: allowedIpKeys.detail(id ?? ''),
    queryFn: ({ signal }) => findAllowedIpById(id ?? '', signal),
    enabled: Boolean(id),
    retry: allowedIpsRetry,
  });
}

export function useCreateAllowedIp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAllowedIpPayload) => createAllowedIp(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: allowedIpKeys.lists() });
      invalidateAllowedIpClientsSummary(queryClient);
    },
  });
}

export function useUpdateAllowedIp(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAllowedIpPayload) => updateAllowedIp(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: allowedIpKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: allowedIpKeys.detail(id) });
      invalidateAllowedIpClientsSummary(queryClient);
    },
  });
}

export function useChangeAllowedIpStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangeAllowedIpStatusPayload) => changeAllowedIpStatus(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: allowedIpKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: allowedIpKeys.detail(id) });
      invalidateAllowedIpClientsSummary(queryClient);
    },
  });
}

export function useDeleteAllowedIp(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteAllowedIp(id),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: allowedIpKeys.lists() });
      queryClient.removeQueries({ queryKey: allowedIpKeys.detail(id) });
      invalidateAllowedIpClientsSummary(queryClient);
    },
    onError: (error) => {
      if (isApiError(error) && error.statusCode === 404) {
        void queryClient.invalidateQueries({ queryKey: allowedIpKeys.lists() });
        invalidateAllowedIpClientsSummary(queryClient);
      }
    },
  });
}

/**
 * Populates the client combobox in the Allowed IPs filter bar and create
 * form. Reuses the real Clients module (`GET /clients?search=&limit=`) —
 * same pattern as the API Keys and Dashboard client pickers.
 */
export function useAllowedIpClientOptions(search: string, enabled: boolean) {
  return useQuery({
    queryKey: ['allowed-ips', 'client-options', search],
    queryFn: ({ signal }) => findClients({ search, limit: 10 }, signal),
    select: (data) => data.items,
    enabled,
    staleTime: 30_000,
  });
}
