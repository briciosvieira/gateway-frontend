import { isApiError, type ApiError } from '@/lib/api/api-error';
import i18next from '@/lib/i18n';

const STATUS_TRANSLATION_KEY: Record<number, string> = {
  401: 'api.errors.unauthorized',
  403: 'api.errors.forbidden',
  404: 'api.errors.notFound',
  408: 'api.errors.timeout',
  409: 'api.errors.conflict',
  429: 'api.errors.rateLimit',
};

function resolveTranslationKey(error: ApiError): string {
  if (error.code === 'NETWORK_ERROR') return 'api.errors.network';
  if (error.code === 'REQUEST_TIMEOUT') return 'api.errors.timeout';

  const knownKey = STATUS_TRANSLATION_KEY[error.statusCode];
  if (knownKey) return knownKey;

  if (error.statusCode >= 500) return 'api.errors.server';

  return 'api.errors.unknown';
}

/**
 * Maps a caught error to a safe, translated, user-facing message. Backend
 * messages are never shown directly (they are English-only technical text
 * today) — the status/code determines a known translation key instead.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isApiError(error)) return fallback;

  return i18next.t(resolveTranslationKey(error), { defaultValue: fallback });
}
