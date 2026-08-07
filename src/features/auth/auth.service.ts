import type {
  AuthenticatedUser,
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
} from '@/features/auth/auth.types';
import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/types/api';

export async function login(payload: LoginRequest, signal?: AbortSignal): Promise<LoginResponse> {
  const response = await apiClient.post<ApiSuccessResponse<LoginResponse>>('/auth/login', payload, {
    signal,
  });

  return response.data.data;
}

export async function refresh(refreshToken: string): Promise<RefreshTokenResponse> {
  const response = await apiClient.post<ApiSuccessResponse<RefreshTokenResponse>>('/auth/refresh', {
    refreshToken,
  });

  return response.data.data;
}

export async function logout(refreshToken?: string): Promise<void> {
  await apiClient.post('/auth/logout', { refreshToken });
}

export async function getMe(signal?: AbortSignal): Promise<AuthenticatedUser> {
  const response = await apiClient.get<ApiSuccessResponse<AuthenticatedUser>>('/auth/me', {
    signal,
  });

  return response.data.data;
}

export async function changePassword(payload: ChangePasswordRequest): Promise<void> {
  await apiClient.post('/auth/change-password', payload);
}
