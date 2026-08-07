import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getTrustedCaUploadErrorMessage } from '@/features/trusted-cas/trusted-ca-errors';
import {
  TRUSTED_CA_ACCEPT_ATTRIBUTE,
  TRUSTED_CA_ACCEPTED_EXTENSIONS,
  TRUSTED_CA_BLOCKED_EXTENSIONS,
} from '@/features/trusted-cas/trusted-cas.constants';
import { useCreateTrustedCa } from '@/features/trusted-cas/trusted-cas.hooks';
import {
  createTrustedCaSchema,
  type CreateTrustedCaFormValues,
} from '@/features/trusted-cas/trusted-cas.schemas';
import type { TrustedCa } from '@/features/trusted-cas/trusted-cas.types';

type FileErrorKind = 'required' | 'blocked' | 'unsupported';

function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex === -1 ? '' : filename.slice(lastDotIndex).toLowerCase();
}

interface CreateTrustedCaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (trustedCa: TrustedCa) => void;
}

export function CreateTrustedCaForm({ open, onOpenChange, onSuccess }: CreateTrustedCaFormProps) {
  const { t } = useTranslation();
  const mutation = useCreateTrustedCa();
  // Bumped after a reset to force-remount the uncontrolled file input,
  // which is the standard way to clear a native `<input type="file">`
  // selection in React (setting `.value` on a controlled prop isn't possible).
  const [fileInputKey, setFileInputKey] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<FileErrorKind | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTrustedCaFormValues>({
    resolver: zodResolver(createTrustedCaSchema),
    defaultValues: { name: '' },
  });

  function resetFormState() {
    reset();
    setFile(null);
    setFileError(null);
    setFileInputKey((key) => key + 1);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetFormState();
    onOpenChange(next);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
    setFileError(null);
  }

  async function onSubmit(values: CreateTrustedCaFormValues) {
    if (!file) {
      setFileError('required');
      return;
    }

    const extension = getFileExtension(file.name);
    if (TRUSTED_CA_BLOCKED_EXTENSIONS.includes(extension)) {
      setFileError('blocked');
      return;
    }
    if (!TRUSTED_CA_ACCEPTED_EXTENSIONS.includes(extension)) {
      setFileError('unsupported');
      return;
    }

    try {
      const trustedCa = await mutation.mutateAsync({ name: values.name, file });
      resetFormState();
      onSuccess(trustedCa);
    } catch {
      // Surfaced via mutation.isError/mutation.error below — nothing else to do here.
    }
  }

  const fileErrorKey =
    fileError === 'required'
      ? 'settings.certificates.form.errors.fileRequired'
      : fileError === 'blocked'
        ? 'settings.certificates.errors.privateKeyNotAllowed'
        : fileError === 'unsupported'
          ? 'settings.certificates.errors.unsupportedFormat'
          : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('settings.certificates.form.createTitle')}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-1.5">
            <label htmlFor="create-trusted-ca-name" className="text-sm font-medium">
              {t('settings.certificates.form.name')}
            </label>
            <Input
              id="create-trusted-ca-name"
              placeholder={t('settings.certificates.form.namePlaceholder')}
              {...register('name')}
            />
            {errors.name?.message && (
              <p className="text-sm text-destructive">{t(errors.name.message)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="create-trusted-ca-file" className="text-sm font-medium">
              {t('settings.certificates.form.file')}
            </label>
            <Input
              key={fileInputKey}
              id="create-trusted-ca-file"
              type="file"
              accept={TRUSTED_CA_ACCEPT_ATTRIBUTE}
              onChange={handleFileChange}
              className="file:mr-3 file:h-7 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:text-sm file:font-medium file:text-secondary-foreground"
            />
            {fileErrorKey ? (
              <p className="text-sm text-destructive">{t(fileErrorKey)}</p>
            ) : (
              <p className="text-xs text-muted">
                {t('settings.certificates.form.acceptedFormats')}
              </p>
            )}
          </div>

          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {getTrustedCaUploadErrorMessage(mutation.error, t('settings.certificates.error'))}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={mutation.isPending}
            >
              {t('common.actions.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? t('shared.confirm.loading')
                : t('settings.certificates.form.submitCreate')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
