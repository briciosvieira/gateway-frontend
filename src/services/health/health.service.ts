import { apiClient } from '@/lib/api/api-client';
import type { HealthResponse } from '@/services/health/health.types';
import type { ApiSuccessResponse } from '@/types/api';

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await apiClient.get<ApiSuccessResponse<HealthResponse>>('/health', {
    signal,
  });

  return response.data.data;
}
