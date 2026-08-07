import type {
  ApiKey,
  ApiKeyClientSummaryItem,
  ChangeApiKeyStatusPayload,
  CreateApiKeyPayload,
  CreateApiKeyResult,
  FindApiKeyClientsSummaryParams,
  FindApiKeysParams,
  RegenerateApiKeyPayload,
  RegenerateApiKeyResult,
  UpdateApiKeyPayload,
} from '@/features/api-keys/api-keys.types';
import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/types/api';
import type { PaginatedData } from '@/types/pagination';

export async function findApiKeys(
  params: FindApiKeysParams,
  signal?: AbortSignal,
): Promise<PaginatedData<ApiKey>> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedData<ApiKey>>>('/api-keys', {
    params,
    signal,
  });

  return response.data.data;
}

/** `GET /api-keys/clients-summary` — one row per client with at least one API Key. */
export async function findApiKeyClientsSummary(
  params: FindApiKeyClientsSummaryParams,
  signal?: AbortSignal,
): Promise<PaginatedData<ApiKeyClientSummaryItem>> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedData<ApiKeyClientSummaryItem>>>(
    '/api-keys/clients-summary',
    { params, signal },
  );

  return response.data.data;
}

export async function findApiKeyById(id: string, signal?: AbortSignal): Promise<ApiKey> {
  const response = await apiClient.get<ApiSuccessResponse<ApiKey>>(`/api-keys/${id}`, { signal });
  return response.data.data;
}

export async function createApiKey(payload: CreateApiKeyPayload): Promise<CreateApiKeyResult> {
  const response = await apiClient.post<ApiSuccessResponse<CreateApiKeyResult>>(
    '/api-keys',
    payload,
  );

  return response.data.data;
}

export async function updateApiKey(id: string, payload: UpdateApiKeyPayload): Promise<ApiKey> {
  const response = await apiClient.patch<ApiSuccessResponse<ApiKey>>(`/api-keys/${id}`, payload);
  return response.data.data;
}

export async function changeApiKeyStatus(
  id: string,
  payload: ChangeApiKeyStatusPayload,
): Promise<ApiKey> {
  const response = await apiClient.patch<ApiSuccessResponse<ApiKey>>(
    `/api-keys/${id}/status`,
    payload,
  );

  return response.data.data;
}

/** No request body. Returns 200 (not 201) — see backend `@HttpCode(HttpStatus.OK)`. */
export async function revokeApiKey(id: string): Promise<ApiKey> {
  const response = await apiClient.post<ApiSuccessResponse<ApiKey>>(`/api-keys/${id}/revoke`);
  return response.data.data;
}

export async function regenerateApiKey(
  id: string,
  payload: RegenerateApiKeyPayload,
): Promise<RegenerateApiKeyResult> {
  const response = await apiClient.post<ApiSuccessResponse<RegenerateApiKeyResult>>(
    `/api-keys/${id}/regenerate`,
    payload,
  );

  return response.data.data;
}

/** ADMIN only. Backend returns 204 No Content. Deletes by internal ID only — the key value is never involved. */
export async function deleteApiKey(id: string): Promise<void> {
  await apiClient.delete(`/api-keys/${id}`);
}
