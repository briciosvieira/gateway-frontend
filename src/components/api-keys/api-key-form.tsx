import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Combobox } from '@/components/shared/combobox';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  useApiKeyClientOptions,
  useCreateApiKey,
  useUpdateApiKey,
} from '@/features/api-keys/api-keys.hooks';
import {
  createApiKeySchema,
  updateApiKeySchema,
  type CreateApiKeyFormValues,
  type UpdateApiKeyFormValues,
} from '@/features/api-keys/api-keys.schemas';
import type {
  ApiKey,
  ApiKeyClientOption,
  CreateApiKeyResult,
} from '@/features/api-keys/api-keys.types';
import { getApiErrorMessage } from '@/lib/api/api-response';

interface CreateApiKeyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (result: CreateApiKeyResult) => void;
  /** Fixes the client and replaces the picker with a read-only display — used when creating from a client's resource drawer. */
  lockedClient?: ApiKeyClientOption;
}

export function CreateApiKeyForm({
  open,
  onOpenChange,
  onSuccess,
  lockedClient,
}: CreateApiKeyFormProps) {
  const { t } = useTranslation();
  const mutation = useCreateApiKey();
  const [client, setClient] = useState<ApiKeyClientOption | null>(lockedClient ?? null);
  const [clientError, setClientError] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateApiKeyFormValues>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: { name: '', expiresAt: '' },
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      reset();
      setClient(lockedClient ?? null);
      setClientError(false);
    }
    onOpenChange(next);
  }

  async function onSubmit(values: CreateApiKeyFormValues) {
    if (!client) {
      setClientError(true);
      return;
    }

    try {
      const result = await mutation.mutateAsync({
        name: values.name,
        clientId: client.id,
        expiresAt: values.expiresAt || undefined,
      });
      reset();
      setClient(lockedClient ?? null);
      onSuccess(result);
    } catch {
      // Surfaced via mutation.isError/mutation.error below — nothing else to do here.
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('apiKeys.form.createTitle')}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            {lockedClient ? (
              <div className="space-y-1.5">
                <span className="text-sm font-medium">{t('apiKeys.form.client')}</span>
                <p className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground">
                  {lockedClient.name} ({lockedClient.code})
                </p>
              </div>
            ) : (
              <>
                <Combobox
                  label={t('apiKeys.form.client')}
                  placeholder={t('apiKeys.filters.clientPlaceholder')}
                  emptyMessage={t('apiKeys.filters.clientEmpty')}
                  value={client}
                  onChange={(next) => {
                    setClient(next);
                    setClientError(false);
                  }}
                  useOptions={useApiKeyClientOptions}
                  getOptionLabel={(option) => `${option.name} (${option.code})`}
                  getOptionId={(option) => option.id}
                />
                {clientError && (
                  <p className="mt-1 text-sm text-destructive">
                    {t('apiKeys.form.errors.clientRequired')}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="create-api-key-name" className="text-sm font-medium">
              {t('apiKeys.form.name')}
            </label>
            <Input id="create-api-key-name" {...register('name')} />
            {errors.name?.message && (
              <p className="text-sm text-destructive">{t(errors.name.message)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="create-api-key-expires-at" className="text-sm font-medium">
              {t('apiKeys.form.expiresAt')}
            </label>
            <Input id="create-api-key-expires-at" type="date" {...register('expiresAt')} />
          </div>

          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {getApiErrorMessage(mutation.error, t('apiKeys.error'))}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={mutation.isPending}
            >
              {t('shared.confirm.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('shared.confirm.loading') : t('apiKeys.form.submitCreate')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditApiKeyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: ApiKey;
  onSuccess: () => void;
}

export function EditApiKeyForm({ open, onOpenChange, apiKey, onSuccess }: EditApiKeyFormProps) {
  const { t } = useTranslation();
  const mutation = useUpdateApiKey(apiKey.id);

  const defaultValues: UpdateApiKeyFormValues = {
    name: apiKey.name,
    expiresAt: apiKey.expiresAt ? apiKey.expiresAt.slice(0, 10) : '',
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateApiKeyFormValues>({
    resolver: zodResolver(updateApiKeySchema),
    defaultValues,
  });

  function handleOpenChange(next: boolean) {
    if (!next) reset(defaultValues);
    onOpenChange(next);
  }

  async function onSubmit(values: UpdateApiKeyFormValues) {
    const payload: Partial<UpdateApiKeyFormValues> = {};
    if (values.name !== defaultValues.name) payload.name = values.name;
    if ((values.expiresAt || '') !== defaultValues.expiresAt) {
      payload.expiresAt = values.expiresAt || undefined;
    }

    try {
      if (Object.keys(payload).length > 0) {
        await mutation.mutateAsync(payload);
      }
      onSuccess();
    } catch {
      // Surfaced via mutation.isError/mutation.error below — nothing else to do here.
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('apiKeys.form.editTitle')}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-1.5">
            <label htmlFor="edit-api-key-name" className="text-sm font-medium">
              {t('apiKeys.form.name')}
            </label>
            <Input id="edit-api-key-name" {...register('name')} />
            {errors.name?.message && (
              <p className="text-sm text-destructive">{t(errors.name.message)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-api-key-expires-at" className="text-sm font-medium">
              {t('apiKeys.form.expiresAt')}
            </label>
            <Input id="edit-api-key-expires-at" type="date" {...register('expiresAt')} />
          </div>

          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {getApiErrorMessage(mutation.error, t('apiKeys.error'))}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={mutation.isPending}
            >
              {t('shared.confirm.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('shared.confirm.loading') : t('apiKeys.form.submitEdit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
