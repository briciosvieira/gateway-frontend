import type {
  AllowedIp,
  AllowedIpClientSummaryItem,
  ChangeAllowedIpStatusPayload,
  CreateAllowedIpPayload,
  FindAllowedIpClientsSummaryParams,
  FindAllowedIpsParams,
  UpdateAllowedIpPayload,
} from '@/features/allowed-ips/allowed-ips.types';
import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/types/api';
import type { PaginatedData } from '@/types/pagination';

export async function findAllowedIps(
  params: FindAllowedIpsParams,
  signal?: AbortSignal,
): Promise<PaginatedData<AllowedIp>> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedData<AllowedIp>>>(
    '/allowed-ips',
    { params, signal },
  );

  return response.data.data;
}

/** `GET /allowed-ips/clients-summary` — one row per client with at least one Allowed IP. */
export async function findAllowedIpClientsSummary(
  params: FindAllowedIpClientsSummaryParams,
  signal?: AbortSignal,
): Promise<PaginatedData<AllowedIpClientSummaryItem>> {
  const response = await apiClient.get<
    ApiSuccessResponse<PaginatedData<AllowedIpClientSummaryItem>>
  >('/allowed-ips/clients-summary', { params, signal });

  return response.data.data;
}

export async function findAllowedIpById(id: string, signal?: AbortSignal): Promise<AllowedIp> {
  const response = await apiClient.get<ApiSuccessResponse<AllowedIp>>(`/allowed-ips/${id}`, {
    signal,
  });

  return response.data.data;
}

export async function createAllowedIp(payload: CreateAllowedIpPayload): Promise<AllowedIp> {
  const response = await apiClient.post<ApiSuccessResponse<AllowedIp>>('/allowed-ips', payload);
  return response.data.data;
}

export async function updateAllowedIp(
  id: string,
  payload: UpdateAllowedIpPayload,
): Promise<AllowedIp> {
  const response = await apiClient.patch<ApiSuccessResponse<AllowedIp>>(
    `/allowed-ips/${id}`,
    payload,
  );

  return response.data.data;
}

export async function changeAllowedIpStatus(
  id: string,
  payload: ChangeAllowedIpStatusPayload,
): Promise<AllowedIp> {
  const response = await apiClient.patch<ApiSuccessResponse<AllowedIp>>(
    `/allowed-ips/${id}/status`,
    payload,
  );

  return response.data.data;
}

/** ADMIN only. Backend returns 204 No Content. Unconditional — no dependency guard on this module. */
export async function deleteAllowedIp(id: string): Promise<void> {
  await apiClient.delete(`/allowed-ips/${id}`);
}
