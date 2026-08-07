import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { PasswordInput } from '@/components/auth/password-input';
import { SessionExpiredDialog } from '@/components/auth/session-expired-dialog';
import { HeroImage } from '@/components/branding/hero-image';
import { LanguageSelector } from '@/components/language/language-selector';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { consumeSessionExpiredFlag } from '@/features/auth/auth-session-events';
import { loginSchema, type LoginFormValues } from '@/features/auth/auth.schemas';
import { useLogin } from '@/features/auth/use-login';
import { isApiError } from '@/lib/api/api-error';

/**
 * `PASSWORD_CHANGE_REQUIRED` never reaches here as an "error" — AuthContext's
 * `login()` treats `mustChangePassword: true` as a successful login and
 * routes to /change-password instead of throwing (see auth-context.tsx).
 * This function only ever sees genuine login failures: invalid credentials,
 * rate limiting, server errors or connectivity issues.
 */
function resolveLoginErrorKey(error: unknown): string {
  if (!isApiError(error)) return 'auth.login.networkError';
  if (error.code === 'NETWORK_ERROR' || error.code === 'REQUEST_TIMEOUT') {
    return 'auth.login.networkError';
  }
  if (error.statusCode === 401) return 'auth.login.invalidCredentials';
  if (error.statusCode === 429) return 'auth.login.rateLimit';
  if (error.statusCode >= 500) return 'api.errors.server';
  return 'api.errors.unknown';
}

export function LoginPage() {
  const { t } = useTranslation();
  const { submit, isSubmitting, error } = useLogin();
  const [showSessionExpired] = useState(() => consumeSessionExpiredFlag());

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { login: '', password: '' },
  });

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground md:flex-row">
      <div className="flex flex-1 items-center justify-center bg-linear-to-br from-surface to-surface-soft p-8 md:order-2">
        <HeroImage className="max-h-56 md:max-h-105" />
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center p-8 md:order-1">
        <div className="absolute right-4 top-4 flex items-center gap-1">
          <LanguageSelector />
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-semibold">{t('auth.login.title')}</h1>
            <p className="text-sm text-muted">{t('auth.login.subtitle')}</p>
          </div>

          {showSessionExpired && <SessionExpiredDialog />}

          <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
            <div className="space-y-1.5">
              <label htmlFor="login-username" className="text-sm font-medium">
                {t('auth.login.loginLabel')}
              </label>
              <Input
                id="login-username"
                type="text"
                autoComplete="username"
                aria-invalid={errors.login ? 'true' : undefined}
                {...register('login')}
              />
              {errors.login?.message && (
                <p className="text-sm text-destructive">{t(errors.login.message)}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-password" className="text-sm font-medium">
                {t('auth.login.passwordLabel')}
              </label>
              <PasswordInput
                id="login-password"
                autoComplete="current-password"
                aria-invalid={errors.password ? 'true' : undefined}
                {...register('password')}
              />
              {errors.password?.message && (
                <p className="text-sm text-destructive">{t(errors.password.message)}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t('auth.login.loading') : t('auth.login.submit')}
            </Button>

            {error !== null && (
              <p role="alert" className="text-center text-sm text-destructive">
                {t(resolveLoginErrorKey(error))}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
