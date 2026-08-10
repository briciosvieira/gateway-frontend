import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch, type UseFormRegister } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Combobox } from '@/components/shared/combobox';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/features/auth/use-auth';
import {
  DEFAULT_GATEWAY_ROUTE_RETRY_COUNT,
  DEFAULT_GATEWAY_ROUTE_TIMEOUT_MS,
  GATEWAY_ROUTE_METHODS,
} from '@/features/gateway-routes/gateway-routes.constants';
import {
  useCreateGatewayRoute,
  useGatewayRouteClientOptions,
  useUpdateGatewayRoute,
} from '@/features/gateway-routes/gateway-routes.hooks';
import {
  createGatewayRouteSchema,
  updateGatewayRouteSchema,
  type CreateGatewayRouteFormValues,
  type UpdateGatewayRouteFormValues,
} from '@/features/gateway-routes/gateway-routes.schemas';
import type {
  CreateGatewayRoutePayload,
  GatewayRoute,
  GatewayRouteClientOption,
  UpdateGatewayRoutePayload,
} from '@/features/gateway-routes/gateway-routes.types';
import { getApiErrorMessage } from '@/lib/api/api-response';
import { cn } from '@/lib/utils';

/** Empty optional fields must be omitted, not sent as `''`. */
function toPayload(
  values: CreateGatewayRouteFormValues,
  clientId: string,
): CreateGatewayRoutePayload {
  return {
    name: values.name,
    slug: values.slug,
    destinationUrl: values.destinationUrl,
    method: values.method,
    clientId,
    description: values.description || undefined,
    timeoutMs: values.timeoutMs,
    retryCount: values.retryCount,
    requiresApiKey: values.requiresApiKey,
  };
}

/**
 * Shared by both Create and Edit forms — `requiresApiKey` is ADMIN-only to
 * change (backend-enforced, `403 REQUIRES_API_KEY_ADMIN_ONLY` otherwise), so
 * OPERATOR/VIEWER/AUDITOR get a disabled, tooltip-explained checkbox that
 * always reflects the current value but can never be toggled.
 */
function RequiresApiKeyField({
  idPrefix,
  isAdmin,
  register,
}: {
  idPrefix: string;
  isAdmin: boolean;
  register: UseFormRegister<CreateGatewayRouteFormValues>;
}) {
  const { t } = useTranslation();
  const fieldId = `${idPrefix}-requires-api-key`;

  const checkboxLabel = (
    <label
      htmlFor={fieldId}
      className={cn('flex items-center gap-2 text-sm', !isAdmin && 'cursor-not-allowed opacity-70')}
    >
      <input
        id={fieldId}
        type="checkbox"
        className="size-4"
        disabled={!isAdmin}
        {...register('requiresApiKey')}
      />
      {t('gatewayRoutes.form.requiresApiKey')}
    </label>
  );

  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium">{t('gatewayRoutes.form.authenticationTitle')}</span>
      {isAdmin ? (
        checkboxLabel
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>{checkboxLabel}</TooltipTrigger>
          <TooltipContent>{t('gatewayRoutes.form.requiresApiKeyAdminOnly')}</TooltipContent>
        </Tooltip>
      )}
      <p className="text-xs text-muted-foreground">{t('gatewayRoutes.form.requiresApiKeyHint')}</p>
    </div>
  );
}

interface CreateGatewayRouteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (route: GatewayRoute) => void;
  /** Fixes the client and replaces the picker with a read-only display — used when creating from a client's resource drawer. */
  lockedClient?: GatewayRouteClientOption;
}

export function CreateGatewayRouteForm({
  open,
  onOpenChange,
  onSuccess,
  lockedClient,
}: CreateGatewayRouteFormProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role.code === 'ADMIN';
  const mutation = useCreateGatewayRoute();
  const [client, setClient] = useState<GatewayRouteClientOption | null>(lockedClient ?? null);
  const [clientError, setClientError] = useState(false);
  // Set only when an ADMIN submits with `requiresApiKey: false` — creating a
  // route is never blocked, but this specific choice needs an explicit,
  // non-silent confirmation before it takes effect.
  const [pendingCreate, setPendingCreate] = useState<{
    values: CreateGatewayRouteFormValues;
    clientId: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateGatewayRouteFormValues>({
    resolver: zodResolver(createGatewayRouteSchema),
    defaultValues: {
      name: '',
      slug: '',
      destinationUrl: '',
      method: 'GET',
      description: '',
      timeoutMs: DEFAULT_GATEWAY_ROUTE_TIMEOUT_MS,
      retryCount: DEFAULT_GATEWAY_ROUTE_RETRY_COUNT,
      requiresApiKey: true,
    },
  });

  const slugValue = useWatch({ control, name: 'slug' });

  function handleOpenChange(next: boolean) {
    if (!next) {
      reset();
      setClient(lockedClient ?? null);
      setClientError(false);
      setPendingCreate(null);
    }
    onOpenChange(next);
  }

  async function performCreate(values: CreateGatewayRouteFormValues, clientId: string) {
    try {
      const route = await mutation.mutateAsync(toPayload(values, clientId));
      reset();
      setClient(lockedClient ?? null);
      onSuccess(route);
    } catch {
      // Surfaced via mutation.isError/mutation.error below — nothing else to do here.
    }
  }

  async function onSubmit(values: CreateGatewayRouteFormValues) {
    if (!client) {
      setClientError(true);
      return;
    }

    // Non-ADMIN can never actually reach `requiresApiKey: false` (the
    // checkbox is disabled), but never trust that alone — the backend is
    // the real authority and would reject it anyway.
    if (isAdmin && !values.requiresApiKey) {
      setPendingCreate({ values, clientId: client.id });
      return;
    }

    await performCreate(values, client.id);
  }

  async function handleConfirmCreate() {
    if (!pendingCreate) return;
    await performCreate(pendingCreate.values, pendingCreate.clientId);
    setPendingCreate(null);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('gatewayRoutes.form.createTitle')}</DialogTitle>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              {lockedClient ? (
                <div className="space-y-1.5">
                  <span className="text-sm font-medium">{t('gatewayRoutes.form.client')}</span>
                  <p className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground">
                    {lockedClient.name} ({lockedClient.code})
                  </p>
                </div>
              ) : (
                <>
                  <Combobox
                    label={t('gatewayRoutes.form.client')}
                    placeholder={t('gatewayRoutes.filters.clientPlaceholder')}
                    emptyMessage={t('gatewayRoutes.filters.clientEmpty')}
                    value={client}
                    onChange={(next) => {
                      setClient(next);
                      setClientError(false);
                    }}
                    useOptions={useGatewayRouteClientOptions}
                    getOptionLabel={(option) => `${option.name} (${option.code})`}
                    getOptionId={(option) => option.id}
                  />
                  {clientError && (
                    <p className="mt-1 text-sm text-destructive">
                      {t('gatewayRoutes.form.errors.clientRequired')}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="create-gateway-route-name" className="text-sm font-medium">
                {t('gatewayRoutes.form.name')}
              </label>
              <Input id="create-gateway-route-name" {...register('name')} />
              {errors.name?.message && (
                <p className="text-sm text-destructive">{t(errors.name.message)}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="create-gateway-route-slug" className="text-sm font-medium">
                {t('gatewayRoutes.form.slug')}
              </label>
              <Input
                id="create-gateway-route-slug"
                placeholder="/send-whatsapp"
                autoComplete="off"
                {...register('slug')}
              />
              {errors.slug?.message && (
                <p className="text-sm text-destructive">{t(errors.slug.message)}</p>
              )}
              <p className="font-mono text-xs text-muted">
                {t('gatewayRoutes.form.publicPathPreview', {
                  path: slugValue
                    ? `/gateway${slugValue.startsWith('/') ? slugValue : `/${slugValue}`}`
                    : '/gateway…',
                })}
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="create-gateway-route-method" className="text-sm font-medium">
                {t('gatewayRoutes.form.method')}
              </label>
              <select
                id="create-gateway-route-method"
                className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('method')}
              >
                {GATEWAY_ROUTE_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              {errors.method?.message && (
                <p className="text-sm text-destructive">{t(errors.method.message)}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="create-gateway-route-destination" className="text-sm font-medium">
                {t('gatewayRoutes.form.destinationUrl')}
              </label>
              <Input
                id="create-gateway-route-destination"
                placeholder="https://internal.example.com/api/orders"
                autoComplete="off"
                {...register('destinationUrl')}
              />
              {errors.destinationUrl?.message && (
                <p className="text-sm text-destructive">{t(errors.destinationUrl.message)}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="create-gateway-route-timeout" className="text-sm font-medium">
                  {t('gatewayRoutes.form.timeoutMs')}
                </label>
                <Input
                  id="create-gateway-route-timeout"
                  type="number"
                  {...register('timeoutMs', { valueAsNumber: true })}
                />
                {errors.timeoutMs?.message && (
                  <p className="text-sm text-destructive">{t(errors.timeoutMs.message)}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="create-gateway-route-retry" className="text-sm font-medium">
                  {t('gatewayRoutes.form.retryCount')}
                </label>
                <Input
                  id="create-gateway-route-retry"
                  type="number"
                  {...register('retryCount', { valueAsNumber: true })}
                />
                {errors.retryCount?.message && (
                  <p className="text-sm text-destructive">{t(errors.retryCount.message)}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="create-gateway-route-description" className="text-sm font-medium">
                {t('gatewayRoutes.form.description')}
              </label>
              <Input id="create-gateway-route-description" {...register('description')} />
              {errors.description?.message && (
                <p className="text-sm text-destructive">{t(errors.description.message)}</p>
              )}
            </div>

            <RequiresApiKeyField
              idPrefix="create-gateway-route"
              isAdmin={isAdmin}
              register={register}
            />

            {mutation.isError && (
              <p role="alert" className="text-sm text-destructive">
                {getApiErrorMessage(mutation.error, t('gatewayRoutes.error'))}
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
                {mutation.isPending
                  ? t('shared.confirm.loading')
                  : t('gatewayRoutes.form.submitCreate')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={pendingCreate !== null}
        onOpenChange={(next) => !next && setPendingCreate(null)}
        title={t('gatewayRoutes.form.disableApiKeyTitle')}
        description={t('gatewayRoutes.form.disableApiKeyDescription')}
        confirmLabel={t('gatewayRoutes.form.disableApiKeyConfirm')}
        variant="warning"
        isLoading={mutation.isPending}
        onConfirm={handleConfirmCreate}
      />
    </>
  );
}

interface EditGatewayRouteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  route: GatewayRoute;
  onSuccess: (route: GatewayRoute) => void;
}

export function EditGatewayRouteForm({
  open,
  onOpenChange,
  route,
  onSuccess,
}: EditGatewayRouteFormProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role.code === 'ADMIN';
  const mutation = useUpdateGatewayRoute(route.id);
  // Set only when an ADMIN actually changes `requiresApiKey` (either
  // direction) — every other field saves immediately, as before.
  const [pendingUpdate, setPendingUpdate] = useState<UpdateGatewayRoutePayload | null>(null);

  const defaultValues: UpdateGatewayRouteFormValues = {
    name: route.name,
    slug: route.slug,
    destinationUrl: route.destinationUrl,
    method: route.method,
    description: route.description ?? '',
    timeoutMs: route.timeoutMs,
    retryCount: route.retryCount,
    requiresApiKey: route.requiresApiKey,
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateGatewayRouteFormValues>({
    resolver: zodResolver(updateGatewayRouteSchema),
    defaultValues,
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      reset(defaultValues);
      setPendingUpdate(null);
    }
    onOpenChange(next);
  }

  async function performUpdate(payload: UpdateGatewayRoutePayload) {
    try {
      const result = Object.keys(payload).length > 0 ? await mutation.mutateAsync(payload) : route;
      onSuccess(result);
    } catch {
      // Surfaced via mutation.isError/mutation.error below — nothing else to do here.
    }
  }

  async function onSubmit(values: UpdateGatewayRouteFormValues) {
    const payload: UpdateGatewayRoutePayload = {};
    if (values.name !== defaultValues.name) payload.name = values.name;
    if (values.slug !== defaultValues.slug) payload.slug = values.slug;
    if (values.destinationUrl !== defaultValues.destinationUrl) {
      payload.destinationUrl = values.destinationUrl;
    }
    if (values.method !== defaultValues.method) payload.method = values.method;
    if ((values.description || '') !== defaultValues.description) {
      payload.description = values.description || undefined;
    }
    if (values.timeoutMs !== defaultValues.timeoutMs) payload.timeoutMs = values.timeoutMs;
    if (values.retryCount !== defaultValues.retryCount) payload.retryCount = values.retryCount;
    // Non-ADMIN's checkbox is disabled and can never actually differ from
    // `defaultValues`, so this only ever fires for an ADMIN's real change.
    if (values.requiresApiKey !== defaultValues.requiresApiKey) {
      payload.requiresApiKey = values.requiresApiKey;
    }

    if (isAdmin && payload.requiresApiKey !== undefined) {
      setPendingUpdate(payload);
      return;
    }

    await performUpdate(payload);
  }

  async function handleConfirmUpdate() {
    if (!pendingUpdate) return;
    await performUpdate(pendingUpdate);
    setPendingUpdate(null);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('gatewayRoutes.form.editTitle')}</DialogTitle>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-1.5">
              <label htmlFor="edit-gateway-route-name" className="text-sm font-medium">
                {t('gatewayRoutes.form.name')}
              </label>
              <Input id="edit-gateway-route-name" {...register('name')} />
              {errors.name?.message && (
                <p className="text-sm text-destructive">{t(errors.name.message)}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-gateway-route-slug" className="text-sm font-medium">
                {t('gatewayRoutes.form.slug')}
              </label>
              <Input id="edit-gateway-route-slug" autoComplete="off" {...register('slug')} />
              {errors.slug?.message && (
                <p className="text-sm text-destructive">{t(errors.slug.message)}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-gateway-route-method" className="text-sm font-medium">
                {t('gatewayRoutes.form.method')}
              </label>
              <select
                id="edit-gateway-route-method"
                className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('method')}
              >
                {GATEWAY_ROUTE_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              {errors.method?.message && (
                <p className="text-sm text-destructive">{t(errors.method.message)}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-gateway-route-destination" className="text-sm font-medium">
                {t('gatewayRoutes.form.destinationUrl')}
              </label>
              <Input
                id="edit-gateway-route-destination"
                autoComplete="off"
                {...register('destinationUrl')}
              />
              {errors.destinationUrl?.message && (
                <p className="text-sm text-destructive">{t(errors.destinationUrl.message)}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="edit-gateway-route-timeout" className="text-sm font-medium">
                  {t('gatewayRoutes.form.timeoutMs')}
                </label>
                <Input
                  id="edit-gateway-route-timeout"
                  type="number"
                  {...register('timeoutMs', { valueAsNumber: true })}
                />
                {errors.timeoutMs?.message && (
                  <p className="text-sm text-destructive">{t(errors.timeoutMs.message)}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="edit-gateway-route-retry" className="text-sm font-medium">
                  {t('gatewayRoutes.form.retryCount')}
                </label>
                <Input
                  id="edit-gateway-route-retry"
                  type="number"
                  {...register('retryCount', { valueAsNumber: true })}
                />
                {errors.retryCount?.message && (
                  <p className="text-sm text-destructive">{t(errors.retryCount.message)}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-gateway-route-description" className="text-sm font-medium">
                {t('gatewayRoutes.form.description')}
              </label>
              <Input id="edit-gateway-route-description" {...register('description')} />
              {errors.description?.message && (
                <p className="text-sm text-destructive">{t(errors.description.message)}</p>
              )}
            </div>

            <RequiresApiKeyField
              idPrefix="edit-gateway-route"
              isAdmin={isAdmin}
              register={register}
            />

            {mutation.isError && (
              <p role="alert" className="text-sm text-destructive">
                {getApiErrorMessage(mutation.error, t('gatewayRoutes.error'))}
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
                {mutation.isPending
                  ? t('shared.confirm.loading')
                  : t('gatewayRoutes.form.submitEdit')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={pendingUpdate !== null}
        onOpenChange={(next) => !next && setPendingUpdate(null)}
        title={t(
          pendingUpdate?.requiresApiKey === false
            ? 'gatewayRoutes.form.disableApiKeyTitle'
            : 'gatewayRoutes.form.enableApiKeyTitle',
        )}
        description={t(
          pendingUpdate?.requiresApiKey === false
            ? 'gatewayRoutes.form.disableApiKeyDescription'
            : 'gatewayRoutes.form.enableApiKeyDescription',
        )}
        confirmLabel={t(
          pendingUpdate?.requiresApiKey === false
            ? 'gatewayRoutes.form.disableApiKeyConfirm'
            : 'gatewayRoutes.form.enableApiKeyConfirm',
        )}
        variant={pendingUpdate?.requiresApiKey === false ? 'warning' : 'default'}
        isLoading={mutation.isPending}
        onConfirm={handleConfirmUpdate}
      />
    </>
  );
}
