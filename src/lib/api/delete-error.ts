import { isApiError, type ApiError } from '@/lib/api/api-error';
import { getApiErrorMessage } from '@/lib/api/api-response';
import i18next from '@/lib/i18n';

/**
 * Delete-flow copy per the task spec — distinct from the generic
 * `getApiErrorMessage` used elsewhere: 403/404 use fixed delete-specific
 * copy (never predicting *why* the backend refused), 409 shows the
 * backend's own `ConflictException` message (curated, safe — dependency
 * conflicts like "client still has API Keys"), never raw Prisma output.
 * Falls back to the shared `api.errors.*` mapping for every other status.
 */
export function getDeleteErrorMessage(error: unknown, fallback: string): string {
  if (!isApiError(error)) return fallback;

  const message = resolveDeleteMessage(error, fallback);
  if (!error.requestId) return message;

  return `${message} ${i18next.t('delete.requestId', { requestId: error.requestId })}`;
}

function resolveDeleteMessage(error: ApiError, fallback: string): string {
  if (error.statusCode === 403) return i18next.t('delete.forbidden');
  if (error.statusCode === 404) return i18next.t('delete.notFound');
  if (error.statusCode === 409) return error.message || i18next.t('delete.conflict');
  return getApiErrorMessage(error, fallback);
}
