import type {
  ChangeClientStatusPayload,
  Client,
  CreateClientPayload,
  FindClientsParams,
  UpdateClientPayload,
} from '@/features/clients/clients.types';
import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/types/api';
import type { PaginatedData } from '@/types/pagination';

export async function findClients(
  params: FindClientsParams,
  signal?: AbortSignal,
): Promise<PaginatedData<Client>> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedData<Client>>>('/clients', {
    params,
    signal,
  });

  return response.data.data;
}

export async function findClientById(id: string, signal?: AbortSignal): Promise<Client> {
  const response = await apiClient.get<ApiSuccessResponse<Client>>(`/clients/${id}`, { signal });
  return response.data.data;
}

export async function createClient(payload: CreateClientPayload): Promise<Client> {
  const response = await apiClient.post<ApiSuccessResponse<Client>>('/clients', payload);
  return response.data.data;
}

export async function updateClient(id: string, payload: UpdateClientPayload): Promise<Client> {
  const response = await apiClient.patch<ApiSuccessResponse<Client>>(`/clients/${id}`, payload);
  return response.data.data;
}

export async function changeClientStatus(
  id: string,
  payload: ChangeClientStatusPayload,
): Promise<Client> {
  const response = await apiClient.patch<ApiSuccessResponse<Client>>(
    `/clients/${id}/status`,
    payload,
  );

  return response.data.data;
}

/** ADMIN only. Backend returns 204 No Content; fails with 409 if the client still has dependencies. */
export async function deleteClient(id: string): Promise<void> {
  await apiClient.delete(`/clients/${id}`);
}
