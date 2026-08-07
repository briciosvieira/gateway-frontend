import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  updateBrandingNameSchema,
  type UpdateBrandingNameFormValues,
} from '@/features/branding/branding.schemas';
import { getApiErrorMessage } from '@/lib/api/api-response';

interface BrandingNameFormProps {
  applicationName: string;
  canEdit: boolean;
  isSubmitting: boolean;
  error: unknown;
  onSubmit: (applicationName: string) => void;
}

/**
 * Reset with the current `applicationName` whenever it changes externally
 * (e.g. after a successful save, or if it's edited from another tab) —
 * `useForm`'s `defaultValues` only applies once on mount, so a live sync
 * needs an explicit `reset()`.
 */
export function BrandingNameForm({
  applicationName,
  canEdit,
  isSubmitting,
  error,
  onSubmit,
}: BrandingNameFormProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateBrandingNameFormValues>({
    resolver: zodResolver(updateBrandingNameSchema),
    defaultValues: { applicationName },
  });

  useEffect(() => {
    reset({ applicationName });
  }, [applicationName, reset]);

  function submit(values: UpdateBrandingNameFormValues) {
    onSubmit(values.applicationName);
  }

  return (
    <form
      className="space-y-3 rounded-lg border border-border bg-card p-4"
      onSubmit={handleSubmit(submit)}
      noValidate
    >
      <h3 className="text-sm font-semibold text-foreground">
        {t('settings.personalization.name.title')}
      </h3>

      <div className="max-w-sm space-y-1.5">
        <label htmlFor="branding-application-name" className="text-sm font-medium">
          {t('settings.personalization.name.label')}
        </label>
        <Input
          id="branding-application-name"
          disabled={!canEdit}
          {...register('applicationName')}
        />
        {errors.applicationName?.message && (
          <p className="text-sm text-destructive">{t(errors.applicationName.message)}</p>
        )}
      </div>

      {error !== null && error !== undefined && (
        <p role="alert" className="text-sm text-destructive">
          {getApiErrorMessage(error, t('settings.personalization.errors.nameUpdateFailed'))}
        </p>
      )}

      {canEdit && (
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? t('shared.confirm.loading') : t('settings.personalization.actions.save')}
        </Button>
      )}
    </form>
  );
}
