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
  useAllowedIpClientOptions,
  useCreateAllowedIp,
  useUpdateAllowedIp,
} from '@/features/allowed-ips/allowed-ips.hooks';
import {
  createAllowedIpSchema,
  updateAllowedIpSchema,
  type CreateAllowedIpFormValues,
  type UpdateAllowedIpFormValues,
} from '@/features/allowed-ips/allowed-ips.schemas';
import type {
  AllowedIp,
  AllowedIpClientOption,
  UpdateAllowedIpPayload,
} from '@/features/allowed-ips/allowed-ips.types';
import { getApiErrorMessage } from '@/lib/api/api-response';

interface CreateAllowedIpFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (allowedIp: AllowedIp) => void;
  /** Fixes the client and replaces the picker with a read-only display — used when creating from a client's resource drawer. */
  lockedClient?: AllowedIpClientOption;
}

export function CreateAllowedIpForm({
  open,
  onOpenChange,
  onSuccess,
  lockedClient,
}: CreateAllowedIpFormProps) {
  const { t } = useTranslation();
  const mutation = useCreateAllowedIp();
  const [client, setClient] = useState<AllowedIpClientOption | null>(lockedClient ?? null);
  const [clientError, setClientError] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAllowedIpFormValues>({
    resolver: zodResolver(createAllowedIpSchema),
    defaultValues: { address: '', description: '' },
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      reset();
      setClient(lockedClient ?? null);
      setClientError(false);
    }
    onOpenChange(next);
  }

  async function onSubmit(values: CreateAllowedIpFormValues) {
    if (!client) {
      setClientError(true);
      return;
    }

    try {
      const result = await mutation.mutateAsync({
        address: values.address,
        clientId: client.id,
        description: values.description || undefined,
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
          <DialogTitle>{t('allowedIps.form.createTitle')}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            {lockedClient ? (
              <div className="space-y-1.5">
                <span className="text-sm font-medium">{t('allowedIps.form.client')}</span>
                <p className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground">
                  {lockedClient.name} ({lockedClient.code})
                </p>
              </div>
            ) : (
              <>
                <Combobox
                  label={t('allowedIps.form.client')}
                  placeholder={t('allowedIps.filters.clientPlaceholder')}
                  emptyMessage={t('allowedIps.filters.clientEmpty')}
                  value={client}
                  onChange={(next) => {
                    setClient(next);
                    setClientError(false);
                  }}
                  useOptions={useAllowedIpClientOptions}
                  getOptionLabel={(option) => `${option.name} (${option.code})`}
                  getOptionId={(option) => option.id}
                />
                {clientError && (
                  <p className="mt-1 text-sm text-destructive">
                    {t('allowedIps.form.errors.clientRequired')}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="create-allowed-ip-address" className="text-sm font-medium">
              {t('allowedIps.form.address')}
            </label>
            <Input
              id="create-allowed-ip-address"
              placeholder="192.168.1.0/24"
              autoComplete="off"
              {...register('address')}
            />
            {errors.address?.message && (
              <p className="text-sm text-destructive">{t(errors.address.message)}</p>
            )}
            <p className="text-xs text-muted">{t('allowedIps.form.addressHint')}</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="create-allowed-ip-description" className="text-sm font-medium">
              {t('allowedIps.form.description')}
            </label>
            <Input id="create-allowed-ip-description" {...register('description')} />
            {errors.description?.message && (
              <p className="text-sm text-destructive">{t(errors.description.message)}</p>
            )}
          </div>

          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {getApiErrorMessage(mutation.error, t('allowedIps.error'))}
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
              {mutation.isPending ? t('shared.confirm.loading') : t('allowedIps.form.submitCreate')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditAllowedIpFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allowedIp: AllowedIp;
  onSuccess: (allowedIp: AllowedIp) => void;
}

export function EditAllowedIpForm({
  open,
  onOpenChange,
  allowedIp,
  onSuccess,
}: EditAllowedIpFormProps) {
  const { t } = useTranslation();
  const mutation = useUpdateAllowedIp(allowedIp.id);

  const defaultValues: UpdateAllowedIpFormValues = {
    address: allowedIp.address,
    description: allowedIp.description ?? '',
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateAllowedIpFormValues>({
    resolver: zodResolver(updateAllowedIpSchema),
    defaultValues,
  });

  function handleOpenChange(next: boolean) {
    if (!next) reset(defaultValues);
    onOpenChange(next);
  }

  async function onSubmit(values: UpdateAllowedIpFormValues) {
    const payload: UpdateAllowedIpPayload = {};
    if (values.address !== defaultValues.address) payload.address = values.address;
    if ((values.description || '') !== defaultValues.description) {
      payload.description = values.description || undefined;
    }

    try {
      const result =
        Object.keys(payload).length > 0 ? await mutation.mutateAsync(payload) : allowedIp;
      onSuccess(result);
    } catch {
      // Surfaced via mutation.isError/mutation.error below — nothing else to do here.
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('allowedIps.form.editTitle')}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-1.5">
            <label htmlFor="edit-allowed-ip-address" className="text-sm font-medium">
              {t('allowedIps.form.address')}
            </label>
            <Input id="edit-allowed-ip-address" autoComplete="off" {...register('address')} />
            {errors.address?.message && (
              <p className="text-sm text-destructive">{t(errors.address.message)}</p>
            )}
            <p className="text-xs text-muted">{t('allowedIps.form.addressHint')}</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-allowed-ip-description" className="text-sm font-medium">
              {t('allowedIps.form.description')}
            </label>
            <Input id="edit-allowed-ip-description" {...register('description')} />
            {errors.description?.message && (
              <p className="text-sm text-destructive">{t(errors.description.message)}</p>
            )}
          </div>

          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {getApiErrorMessage(mutation.error, t('allowedIps.error'))}
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
              {mutation.isPending ? t('shared.confirm.loading') : t('allowedIps.form.submitEdit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
