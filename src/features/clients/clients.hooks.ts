import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  changeClientStatus,
  createClient,
  deleteClient,
  findClientById,
  findClients,
  updateClient,
} from '@/features/clients/clients.service';
import type {
  ChangeClientStatusPayload,
  CreateClientPayload,
  FindClientsParams,
  UpdateClientPayload,
} from '@/features/clients/clients.types';
import { isApiError } from '@/lib/api/api-error';

export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (params: FindClientsParams) => [...clientKeys.lists(), params] as const,
  details: () => [...clientKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
};

/** Only retries on 5xx responses, up to twice — never on 4xx or network errors. */
function clientsRetry(failureCount: number, error: unknown): boolean {
  if (!isApiError(error)) return false;
  return error.statusCode >= 500 && failureCount < 2;
}

export function useClients(params: FindClientsParams) {
  return useQuery({
    queryKey: clientKeys.list(params),
    queryFn: ({ signal }) => findClients(params, signal),
    staleTime: 30_000,
    retry: clientsRetry,
    // Keeps the current page's rows on screen while the next page loads,
    // instead of flashing the skeleton/empty state on every filter change.
    placeholderData: keepPreviousData,
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: clientKeys.detail(id ?? ''),
    queryFn: ({ signal }) => findClientById(id ?? '', signal),
    enabled: Boolean(id),
    retry: clientsRetry,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateClientPayload) => createClient(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}

export function useUpdateClient(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateClientPayload) => updateClient(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: clientKeys.detail(id) });
    },
  });
}

export function useChangeClientStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangeClientStatusPayload) => changeClientStatus(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: clientKeys.detail(id) });
    },
  });
}

export function useDeleteClient(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteClient(id),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.removeQueries({ queryKey: clientKeys.detail(id) });
    },
    onError: (error) => {
      // 404 means the record is already gone (e.g. deleted elsewhere) — refresh the list to drop it.
      if (isApiError(error) && error.statusCode === 404) {
        void queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      }
    },
  });
}
