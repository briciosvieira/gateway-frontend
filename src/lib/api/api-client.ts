import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import { env } from '@/config/env';
import { emitSessionExpired } from '@/features/auth/auth-session-events';
import { ApiError } from '@/lib/api/api-error';
import { refreshAccessToken } from '@/lib/api/refresh-token';
import { createRequestId } from '@/lib/api/request-id';
import { tokenStorage } from '@/lib/api/token-storage';
import type { ApiErrorResponse } from '@/types/api';

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const SKIP_REFRESH_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];

function shouldSkipRefresh(url: string | undefined): boolean {
  if (!url) return false;
  return SKIP_REFRESH_PATHS.some((path) => url.includes(path));
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.VITE_API_URL,
  timeout: env.VITE_REQUEST_TIMEOUT,
  headers: {
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  config.headers.set('X-Request-ID', createRequestId());

  const accessToken = tokenStorage.getAccessToken();
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return config;
});

function toReadableMessage(message: string | string[] | undefined, fallback: string): string {
  if (!message) return fallback;
  if (Array.isArray(message)) return message[0] ?? fallback;
  return message;
}

function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
  return typeof data === 'object' && data !== null && 'success' in data && data.success === false;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    if (axios.isCancel(error)) {
      return Promise.reject(
        new ApiError('The request was cancelled.', {
          statusCode: 0,
          code: 'REQUEST_CANCELLED',
          cause: error,
        }),
      );
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(
        new ApiError('The request took too long to complete.', {
          statusCode: 408,
          code: 'REQUEST_TIMEOUT',
          cause: error,
        }),
      );
    }

    if (!error.response) {
      return Promise.reject(
        new ApiError('Unable to connect to the server.', {
          statusCode: 0,
          code: 'NETWORK_ERROR',
          cause: error,
        }),
      );
    }

    const config = error.config as RetryableRequestConfig | undefined;

    if (
      error.response.status === 401 &&
      config &&
      !config._retry &&
      !shouldSkipRefresh(config.url)
    ) {
      config._retry = true;

      const newAccessToken = await refreshAccessToken();

      if (newAccessToken) {
        return apiClient(config);
      }

      tokenStorage.clear();
      emitSessionExpired();
    }

    const data: unknown = error.response.data;
    const requestIdHeader = error.response.headers?.['x-request-id'];
    const requestId = typeof requestIdHeader === 'string' ? requestIdHeader : undefined;

    if (isApiErrorResponse(data)) {
      return Promise.reject(
        new ApiError(toReadableMessage(data.message, 'The request failed.'), {
          statusCode: data.statusCode ?? error.response.status,
          code: data.code,
          requestId: data.requestId ?? requestId,
          details: data,
          cause: error,
        }),
      );
    }

    return Promise.reject(
      new ApiError('An unexpected error occurred.', {
        statusCode: error.response.status,
        code: 'UNEXPECTED_ERROR',
        requestId,
        cause: error,
      }),
    );
  },
);
