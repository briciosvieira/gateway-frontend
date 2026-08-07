import type {
  ChangeTrustedCaStatusPayload,
  CreateTrustedCaPayload,
  FindTrustedCasParams,
  TrustedCa,
} from '@/features/trusted-cas/trusted-cas.types';
import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/types/api';
import type { PaginatedData } from '@/types/pagination';

export async function findTrustedCas(
  params: FindTrustedCasParams,
  signal?: AbortSignal,
): Promise<PaginatedData<TrustedCa>> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedData<TrustedCa>>>(
    '/trusted-cas',
    { params, signal },
  );

  return response.data.data;
}

export async function findTrustedCaById(id: string, signal?: AbortSignal): Promise<TrustedCa> {
  const response = await apiClient.get<ApiSuccessResponse<TrustedCa>>(`/trusted-cas/${id}`, {
    signal,
  });

  return response.data.data;
}

/**
 * multipart/form-data upload — field names (`name`, `file`) match the real
 * backend DTO exactly. Never set a `Content-Type` header manually here:
 * axios/the browser compute the correct `multipart/form-data; boundary=...`
 * value from the `FormData` instance automatically.
 */
export async function createTrustedCa(payload: CreateTrustedCaPayload): Promise<TrustedCa> {
  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('file', payload.file);

  // The default XHR adapter has unreliable `FormData` handling in some
  // environments; the fetch adapter is the well-supported path for
  // multipart bodies in every modern browser this app targets.
  const response = await apiClient.post<ApiSuccessResponse<TrustedCa>>('/trusted-cas', formData, {
    adapter: 'fetch',
  });

  return response.data.data;
}

export async function changeTrustedCaStatus(
  id: string,
  payload: ChangeTrustedCaStatusPayload,
): Promise<TrustedCa> {
  const response = await apiClient.patch<ApiSuccessResponse<TrustedCa>>(
    `/trusted-cas/${id}/status`,
    payload,
  );

  return response.data.data;
}

/** ADMIN only. Backend returns 204 No Content. Unconditional — no dependency guard on this module. */
export async function deleteTrustedCa(id: string): Promise<void> {
  await apiClient.delete(`/trusted-cas/${id}`);
}
