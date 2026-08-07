import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
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
import { useCreateClient, useUpdateClient } from '@/features/clients/clients.hooks';
import {
  createClientSchema,
  updateClientSchema,
  type CreateClientFormValues,
  type UpdateClientFormValues,
} from '@/features/clients/clients.schemas';
import type {
  Client,
  CreateClientPayload,
  UpdateClientPayload,
} from '@/features/clients/clients.types';
import { generateIdentifier } from '@/features/clients/utils/generate-identifier';
import { getApiErrorMessage } from '@/lib/api/api-response';

/** Empty optional fields must be omitted, not sent as `''` — `contactEmail` fails `@IsEmail()` on an empty string. */
function toPayload(values: CreateClientFormValues): CreateClientPayload {
  return {
    name: values.name,
    description: values.description || undefined,
    contactName: values.contactName || undefined,
    contactEmail: values.contactEmail || undefined,
  };
}

interface CreateClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (client: Client) => void;
}

export function CreateClientForm({ open, onOpenChange, onSuccess }: CreateClientFormProps) {
  const { t } = useTranslation();
  const mutation = useCreateClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateClientFormValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: { name: '', description: '', contactName: '', contactEmail: '' },
  });

  const watchedName = useWatch({ control, name: 'name' });
  const identifierPreview = generateIdentifier(watchedName || '');

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function onSubmit(values: CreateClientFormValues) {
    try {
      const client = await mutation.mutateAsync(toPayload(values));
      reset();
      onSuccess(client);
    } catch {
      // Surfaced via mutation.isError/mutation.error below — nothing else to do here.
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('clients.form.createTitle')}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-1.5">
            <label htmlFor="create-client-name" className="text-sm font-medium">
              {t('clients.form.name')}
            </label>
            <Input id="create-client-name" {...register('name')} />
            {errors.name?.message && (
              <p className="text-sm text-destructive">{t(errors.name.message)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="create-client-identifier" className="text-sm font-medium">
              {t('clients.fields.identifier')}
            </label>
            <Input
              id="create-client-identifier"
              value={identifierPreview}
              readOnly
              disabled
              placeholder={t('clients.identifier.generatedHint')}
            />
            <p className="text-sm text-muted-foreground">
              {identifierPreview
                ? t('clients.identifier.generatedHint')
                : t('clients.identifier.emptyHint')}
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="create-client-description" className="text-sm font-medium">
              {t('clients.form.description')}
            </label>
            <Input id="create-client-description" {...register('description')} />
            {errors.description?.message && (
              <p className="text-sm text-destructive">{t(errors.description.message)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="create-client-contact-name" className="text-sm font-medium">
              {t('clients.form.contactName')}
            </label>
            <Input id="create-client-contact-name" {...register('contactName')} />
            {errors.contactName?.message && (
              <p className="text-sm text-destructive">{t(errors.contactName.message)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="create-client-contact-email" className="text-sm font-medium">
              {t('clients.form.contactEmail')}
            </label>
            <Input id="create-client-contact-email" type="email" {...register('contactEmail')} />
            {errors.contactEmail?.message && (
              <p className="text-sm text-destructive">{t(errors.contactEmail.message)}</p>
            )}
          </div>

          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {getApiErrorMessage(mutation.error, t('clients.error'))}
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
              {mutation.isPending ? t('shared.confirm.loading') : t('clients.form.submitCreate')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  onSuccess: () => void;
}

export function EditClientForm({ open, onOpenChange, client, onSuccess }: EditClientFormProps) {
  const { t } = useTranslation();
  const mutation = useUpdateClient(client.id);

  const defaultValues: UpdateClientFormValues = {
    name: client.name,
    description: client.description ?? '',
    contactName: client.contactName ?? '',
    contactEmail: client.contactEmail ?? '',
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateClientFormValues>({
    resolver: zodResolver(updateClientSchema),
    defaultValues,
  });

  function handleOpenChange(next: boolean) {
    if (!next) reset(defaultValues);
    onOpenChange(next);
  }

  async function onSubmit(values: UpdateClientFormValues) {
    const payload: UpdateClientPayload = {};
    if (values.name !== defaultValues.name) payload.name = values.name;
    if ((values.description || '') !== defaultValues.description) {
      payload.description = values.description || undefined;
    }
    if ((values.contactName || '') !== defaultValues.contactName) {
      payload.contactName = values.contactName || undefined;
    }
    if ((values.contactEmail || '') !== defaultValues.contactEmail) {
      payload.contactEmail = values.contactEmail || undefined;
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
          <DialogTitle>{t('clients.form.editTitle')}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-1.5">
            <label htmlFor="edit-client-name" className="text-sm font-medium">
              {t('clients.form.name')}
            </label>
            <Input id="edit-client-name" {...register('name')} />
            {errors.name?.message && (
              <p className="text-sm text-destructive">{t(errors.name.message)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-client-identifier" className="text-sm font-medium">
              {t('clients.fields.identifier')}
            </label>
            <Input id="edit-client-identifier" value={client.code} readOnly disabled />
            <p className="text-sm text-muted-foreground">{t('clients.identifier.immutableHint')}</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-client-description" className="text-sm font-medium">
              {t('clients.form.description')}
            </label>
            <Input id="edit-client-description" {...register('description')} />
            {errors.description?.message && (
              <p className="text-sm text-destructive">{t(errors.description.message)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-client-contact-name" className="text-sm font-medium">
              {t('clients.form.contactName')}
            </label>
            <Input id="edit-client-contact-name" {...register('contactName')} />
            {errors.contactName?.message && (
              <p className="text-sm text-destructive">{t(errors.contactName.message)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-client-contact-email" className="text-sm font-medium">
              {t('clients.form.contactEmail')}
            </label>
            <Input id="edit-client-contact-email" type="email" {...register('contactEmail')} />
            {errors.contactEmail?.message && (
              <p className="text-sm text-destructive">{t(errors.contactEmail.message)}</p>
            )}
          </div>

          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {getApiErrorMessage(mutation.error, t('clients.error'))}
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
              {mutation.isPending ? t('shared.confirm.loading') : t('clients.form.submitEdit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
