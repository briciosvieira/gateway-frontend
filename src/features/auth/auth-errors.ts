import { isApiError } from '@/lib/api/api-error';

export const PASSWORD_CHANGE_REQUIRED_CODE = 'PASSWORD_CHANGE_REQUIRED';

/**
 * True only for the backend's `FirstLoginGuard` rejection — confirmed
 * against `src/modules/auth/guards/first-login.guard.ts`: any protected
 * endpoint other than `POST /auth/change-password` throws
 * `403 ForbiddenException({ message, code: 'PASSWORD_CHANGE_REQUIRED' })`
 * for a user whose `firstLogin` flag is still `true`. This is not a network
 * failure, not invalid credentials, and not a generic 403 — it means the
 * session is valid but the backend requires a password change before
 * anything else will be served.
 */
export function isPasswordChangeRequiredError(error: unknown): boolean {
  return (
    isApiError(error) && error.statusCode === 403 && error.code === PASSWORD_CHANGE_REQUIRED_CODE
  );
}
