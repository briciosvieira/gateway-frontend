import { isApiError, type ApiError } from '@/lib/api/api-error';
import { getApiErrorMessage } from '@/lib/api/api-response';
import i18next from '@/lib/i18n';

/**
 * Maps the real `code` values thrown by the backend's trusted CA upload
 * pipeline (`trusted-cas.controller.ts` + `trusted-ca-certificate.util.ts`
 * + `trusted-cas.service.ts`) to translated, user-facing copy. Falls back
 * to the shared `api.errors.*` mapping (`getApiErrorMessage`) for anything
 * not specific to this upload (401/403/429/5xx/network/unknown).
 */
export function getTrustedCaUploadErrorMessage(error: unknown, fallback: string): string {
  if (!isApiError(error)) return fallback;

  const key = resolveUploadErrorKey(error);
  if (!key) return getApiErrorMessage(error, fallback);

  return i18next.t(key, { defaultValue: fallback });
}

function resolveUploadErrorKey(error: ApiError): string | null {
  switch (error.code) {
    case 'PRIVATE_KEY_NOT_ALLOWED':
      return 'settings.certificates.errors.privateKeyNotAllowed';
    case 'UNSUPPORTED_CERTIFICATE_FORMAT':
      return 'settings.certificates.errors.unsupportedFormat';
    case 'INVALID_CERTIFICATE':
      return 'settings.certificates.errors.invalidCertificate';
    case 'CERTIFICATE_NOT_CA':
      return 'settings.certificates.errors.notCa';
    case 'CERTIFICATE_EXPIRED':
      return 'settings.certificates.errors.expired';
    case 'INVALID_TRUSTED_CA_NAME':
      return 'settings.certificates.errors.invalidName';
    case 'TRUSTED_CA_ALREADY_EXISTS':
      return 'settings.certificates.errors.alreadyExists';
    case 'FILE_TOO_LARGE':
      return 'settings.certificates.errors.fileTooLarge';
    case 'INVALID_MULTIPART_REQUEST':
    case 'INVALID_TRUSTED_CA_UPLOAD':
      return 'settings.certificates.errors.invalidUpload';
    default:
      return null;
  }
}
