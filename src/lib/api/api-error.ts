import type { ApiErrorResponse } from '@/types/api';

interface ApiErrorOptions {
  statusCode: number;
  code?: string;
  requestId?: string;
  details?: ApiErrorResponse;
  cause?: unknown;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly details?: ApiErrorResponse;

  constructor(message: string, options: ApiErrorOptions) {
    super(message, { cause: options.cause });

    this.name = 'ApiError';
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.requestId = options.requestId;
    this.details = options.details;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
