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
  AllowedIpType,
  UpdateAllowedIpPayload,
} from '@/features/allowed-ips/allowed-ips.types';
import { getApiErrorMessage } from '@/lib/api/api-response';

/**
 * UI-only grouping over the real `AllowedIpType` — the backend has no
 * `type` input field at all (see `allowed-ips.schemas.ts`): `address` alone
 * is parsed and classified server-side (`parseAllowedIpAddress`). This
 * selector exists purely to drive the label/placeholder/hint below; its
 * value is NEVER sent in the payload.
 */
type AllowedIpSourceType = 'IP' | 'CIDR' | 'DNS';

function sourceTypeFromAllowedIpType(type: AllowedIpType): AllowedIpSourceType {
  if (type === 'HOSTNAME') return 'DNS';
  if (type === 'CIDR_IPV4' || type === 'CIDR_IPV6') return 'CIDR';
  return 'IP';
}

const ADDRESS_PLACEHOLDER: Record<AllowedIpSourceType, string> = {
  IP: '177.207.247.1',
  CIDR: '177.207.247.0/24',
  DNS: 'api.cliente.com.br',
};

const ADDRESS_LABEL_KEY: Record<AllowedIpSourceType, string> = {
  IP: 'allowedIps.form.addressLabelByType.ip',
  CIDR: 'allowedIps.form.addressLabelByType.cidr',
  DNS: 'allowedIps.form.addressLabelByType.dns',
};

// Deliberately basic — the real format authority is the backend's
// `parseAllowedIpAddress`/`parseAllowedHostname` (ipaddr.js + a dedicated
// hostname parser). This only rejects the obviously-wrong shapes (protocol,
// path, port, whitespace) before a round-trip; anything else still surfaces
// as a translated 400 from the real request, same as IP/CIDR already do.
const DNS_DISALLOWED_CHARACTERS = /[\s/:]/;

function isObviouslyInvalidHostname(value: string): boolean {
  return DNS_DISALLOWED_CHARACTERS.test(value.trim());
}

interface AllowedIpSourceTypeFieldProps {
  idPrefix: string;
  value: AllowedIpSourceType;
  onChange: (next: AllowedIpSourceType) => void;
}

function AllowedIpSourceTypeField({ idPrefix, value, onChange }: AllowedIpSourceTypeFieldProps) {
  const { t } = useTranslation();
  const fieldId = `${idPrefix}-source-type`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium">
        {t('allowedIps.form.sourceType.label')}
      </label>
      <select
        id={fieldId}
        className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={value}
        onChange={(event) => onChange(event.target.value as AllowedIpSourceType)}
      >
        <option value="IP">{t('allowedIps.form.sourceType.ip')}</option>
        <option value="CIDR">{t('allowedIps.form.sourceType.cidr')}</option>
        <option value="DNS">{t('allowedIps.form.sourceType.dns')}</option>
      </select>
    </div>
  );
}

function AddressFieldHint({ sourceType }: { sourceType: AllowedIpSourceType }) {
  const { t } = useTranslation();

  if (sourceType === 'DNS') {
    return (
      <div className="space-y-1">
        <p className="text-xs text-muted">{t('allowedIps.form.dnsHelp')}</p>
        <p className="text-xs text-muted-foreground">{t('allowedIps.form.dnsCacheNote')}</p>
      </div>
    );
  }

  return <p className="text-xs text-muted">{t('allowedIps.form.addressHint')}</p>;
}

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
  const [sourceType, setSourceType] = useState<AllowedIpSourceType>('IP');

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
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
      setSourceType('IP');
    }
    onOpenChange(next);
  }

  async function onSubmit(values: CreateAllowedIpFormValues) {
    if (!client) {
      setClientError(true);
      return;
    }

    if (sourceType === 'DNS' && isObviouslyInvalidHostname(values.address)) {
      setError('address', { type: 'manual', message: 'allowedIps.form.errors.dnsFormatInvalid' });
      return;
    }

    // Backend normalizes IP/CIDR itself; DNS gets the same trim+lowercase
    // treatment client-side too (harmless — the backend does this exact
    // normalization already), never applied to IP/CIDR values.
    const address = sourceType === 'DNS' ? values.address.trim().toLowerCase() : values.address;

    try {
      const result = await mutation.mutateAsync({
        address,
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

          <AllowedIpSourceTypeField
            idPrefix="create-allowed-ip"
            value={sourceType}
            onChange={(next) => {
              setSourceType(next);
              clearErrors('address');
            }}
          />

          <div className="space-y-1.5">
            <label htmlFor="create-allowed-ip-address" className="text-sm font-medium">
              {t(ADDRESS_LABEL_KEY[sourceType])}
            </label>
            <Input
              id="create-allowed-ip-address"
              placeholder={ADDRESS_PLACEHOLDER[sourceType]}
              autoComplete="off"
              {...register('address')}
            />
            {errors.address?.message && (
              <p className="text-sm text-destructive">{t(errors.address.message)}</p>
            )}
            <AddressFieldHint sourceType={sourceType} />
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
  const initialSourceType = sourceTypeFromAllowedIpType(allowedIp.type);
  const [sourceType, setSourceType] = useState<AllowedIpSourceType>(initialSourceType);

  const defaultValues: UpdateAllowedIpFormValues = {
    address: allowedIp.address,
    description: allowedIp.description ?? '',
  };

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<UpdateAllowedIpFormValues>({
    resolver: zodResolver(updateAllowedIpSchema),
    defaultValues,
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      reset(defaultValues);
      setSourceType(initialSourceType);
    }
    onOpenChange(next);
  }

  async function onSubmit(values: UpdateAllowedIpFormValues) {
    if (sourceType === 'DNS' && isObviouslyInvalidHostname(values.address)) {
      setError('address', { type: 'manual', message: 'allowedIps.form.errors.dnsFormatInvalid' });
      return;
    }

    const address = sourceType === 'DNS' ? values.address.trim().toLowerCase() : values.address;

    const payload: UpdateAllowedIpPayload = {};
    if (address !== defaultValues.address) payload.address = address;
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
          <AllowedIpSourceTypeField
            idPrefix="edit-allowed-ip"
            value={sourceType}
            onChange={(next) => {
              setSourceType(next);
              clearErrors('address');
            }}
          />

          <div className="space-y-1.5">
            <label htmlFor="edit-allowed-ip-address" className="text-sm font-medium">
              {t(ADDRESS_LABEL_KEY[sourceType])}
            </label>
            <Input
              id="edit-allowed-ip-address"
              placeholder={ADDRESS_PLACEHOLDER[sourceType]}
              autoComplete="off"
              {...register('address')}
            />
            {errors.address?.message && (
              <p className="text-sm text-destructive">{t(errors.address.message)}</p>
            )}
            <AddressFieldHint sourceType={sourceType} />
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
