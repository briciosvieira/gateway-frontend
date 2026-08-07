import { isApiError } from '@/lib/api/api-error';
import { getApiErrorMessage } from '@/lib/api/api-response';
import i18next from '@/lib/i18n';

/**
 * The live OpenAPI schema only documents a generic 400 for branding asset
 * uploads (no specific `code` enum like Trusted CAs has) — but NestJS's
 * file-interceptor pipeline commonly surfaces oversized/unsupported files
 * as 413/415 depending on where the rejection happens. This maps whatever
 * status the backend actually returns to a specific, friendly message
 * without assuming any backend behavior beyond documented HTTP semantics;
 * anything else falls back to the shared `api.errors.*` mapping.
 */
export function getBrandingUploadErrorMessage(error: unknown, fallback: string): string {
  if (!isApiError(error)) return fallback;

  if (error.statusCode === 413) {
    return i18next.t('settings.personalization.errors.fileTooLarge', { defaultValue: fallback });
  }
  if (error.statusCode === 415) {
    return i18next.t('settings.personalization.errors.unsupportedFormat', {
      defaultValue: fallback,
    });
  }
  if (error.statusCode === 400) {
    return i18next.t('settings.personalization.errors.invalidFile', { defaultValue: fallback });
  }

  return getApiErrorMessage(error, fallback);
}
