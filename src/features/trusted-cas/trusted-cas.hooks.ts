import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  changeTrustedCaStatus,
  createTrustedCa,
  deleteTrustedCa,
  findTrustedCaById,
  findTrustedCas,
} from '@/features/trusted-cas/trusted-cas.service';
import type {
  ChangeTrustedCaStatusPayload,
  CreateTrustedCaPayload,
  FindTrustedCasParams,
} from '@/features/trusted-cas/trusted-cas.types';
import { isApiError } from '@/lib/api/api-error';

export const trustedCaKeys = {
  all: ['trusted-cas'] as const,
  lists: () => [...trustedCaKeys.all, 'list'] as const,
  list: (params: FindTrustedCasParams) => [...trustedCaKeys.lists(), params] as const,
  details: () => [...trustedCaKeys.all, 'detail'] as const,
  detail: (id: string) => [...trustedCaKeys.details(), id] as const,
};

/** Only retries on 5xx responses, up to twice — never on 4xx or network errors. */
function trustedCasRetry(failureCount: number, error: unknown): boolean {
  if (!isApiError(error)) return false;
  return error.statusCode >= 500 && failureCount < 2;
}

export function useTrustedCas(params: FindTrustedCasParams) {
  return useQuery({
    queryKey: trustedCaKeys.list(params),
    queryFn: ({ signal }) => findTrustedCas(params, signal),
    staleTime: 30_000,
    retry: trustedCasRetry,
    // Keeps the current page's rows on screen while the next page loads.
    placeholderData: keepPreviousData,
  });
}

export function useTrustedCa(id: string | undefined) {
  return useQuery({
    queryKey: trustedCaKeys.detail(id ?? ''),
    queryFn: ({ signal }) => findTrustedCaById(id ?? '', signal),
    enabled: Boolean(id),
    retry: trustedCasRetry,
  });
}

export function useCreateTrustedCa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTrustedCaPayload) => createTrustedCa(payload),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: trustedCaKeys.lists() });
    },
  });
}

export function useChangeTrustedCaStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangeTrustedCaStatusPayload) => changeTrustedCaStatus(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: trustedCaKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: trustedCaKeys.detail(id) });
    },
  });
}

export function useDeleteTrustedCa(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteTrustedCa(id),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: trustedCaKeys.lists() });
      queryClient.removeQueries({ queryKey: trustedCaKeys.detail(id) });
    },
    onError: (error) => {
      // 404 means the record is already gone (e.g. deleted elsewhere) — refresh the list to drop it.
      if (isApiError(error) && error.statusCode === 404) {
        void queryClient.invalidateQueries({ queryKey: trustedCaKeys.lists() });
      }
    },
  });
}
