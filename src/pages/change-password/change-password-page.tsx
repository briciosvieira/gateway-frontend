import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { PasswordInput } from '@/components/auth/password-input';
import { PasswordRequirements } from '@/components/auth/password-requirements';
import { Button } from '@/components/ui/button';
import { changePasswordSchema, type ChangePasswordFormValues } from '@/features/auth/auth.schemas';
import { useChangePassword } from '@/features/auth/use-change-password';
import { isApiError } from '@/lib/api/api-error';

function resolveChangePasswordErrorKey(error: unknown): string {
  if (!isApiError(error)) return 'api.errors.unknown';
  if (error.code === 'NETWORK_ERROR' || error.code === 'REQUEST_TIMEOUT') {
    return 'auth.login.networkError';
  }
  if (error.statusCode === 401) return 'auth.changePassword.error';
  return 'api.errors.unknown';
}

export function ChangePasswordPage() {
  const { t } = useTranslation();
  const { submit, isSubmitting, isSuccess, error } = useChangePassword();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const newPassword = useWatch({ control, name: 'newPassword' });
  const confirmPassword = useWatch({ control, name: 'confirmPassword' });

  function onSubmit(values: ChangePasswordFormValues) {
    return submit({ currentPassword: values.currentPassword, newPassword: values.newPassword });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8 text-foreground">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">{t('auth.changePassword.title')}</h1>
        </div>

        {isSuccess ? (
          <p role="status" className="text-center text-sm text-primary">
            {t('auth.changePassword.success')}
          </p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-1.5">
              <label htmlFor="current-password" className="text-sm font-medium">
                {t('auth.changePassword.currentPassword')}
              </label>
              <PasswordInput
                id="current-password"
                autoComplete="current-password"
                aria-invalid={errors.currentPassword ? 'true' : undefined}
                {...register('currentPassword')}
              />
              {errors.currentPassword?.message && (
                <p className="text-sm text-destructive">{t(errors.currentPassword.message)}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="new-password" className="text-sm font-medium">
                {t('auth.changePassword.newPassword')}
              </label>
              <PasswordInput
                id="new-password"
                autoComplete="new-password"
                aria-invalid={errors.newPassword ? 'true' : undefined}
                {...register('newPassword')}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirm-password" className="text-sm font-medium">
                {t('auth.changePassword.confirmPassword')}
              </label>
              <PasswordInput
                id="confirm-password"
                autoComplete="new-password"
                aria-invalid={errors.confirmPassword ? 'true' : undefined}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword?.message && (
                <p className="text-sm text-destructive">{t(errors.confirmPassword.message)}</p>
              )}
            </div>

            <PasswordRequirements password={newPassword} confirmPassword={confirmPassword} />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t('auth.login.loading') : t('auth.changePassword.submit')}
            </Button>

            {error !== null && (
              <p role="alert" className="text-center text-sm text-destructive">
                {t(resolveChangePasswordErrorKey(error))}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
