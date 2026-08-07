import { QueryClient } from '@tanstack/react-query';

import { isApiError } from '@/lib/api/api-error';

const NO_RETRY_STATUS_CODES = new Set([400, 401, 403, 404, 409, 429]);

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isApiError(error) && NO_RETRY_STATUS_CODES.has(error.statusCode)) {
    return false;
  }

  return failureCount < 1;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
