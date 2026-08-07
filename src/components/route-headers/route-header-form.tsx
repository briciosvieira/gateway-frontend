import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { MethodBadge } from '@/components/gateway-routes/method-badge';
import { PublicEndpointField } from '@/components/gateway-routes/public-endpoint-field';
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
  useCreateRouteHeader,
  useRouteHeaderGatewayRoute,
  useRouteHeaderGatewayRouteOptions,
  useUpdateRouteHeader,
} from '@/features/route-headers/route-headers.hooks';
import {
  createRouteHeaderSchema,
  type CreateRouteHeaderFormValues,
  type UpdateRouteHeaderFormValues,
  updateRouteHeaderSchema,
} from '@/features/route-headers/route-headers.schemas';
import type {
  CreateRouteHeaderPayload,
  RouteHeader,
  RouteHeaderGatewayRouteOption,
  UpdateRouteHeaderPayload,
} from '@/features/route-headers/route-headers.types';
import { getApiErrorMessage } from '@/lib/api/api-response';

interface RouteContextSummaryProps {
  route: RouteHeaderGatewayRouteOption | null;
}

function getEditDefaultValues(routeHeader: RouteHeader): UpdateRouteHeaderFormValues {
  return {
    name: routeHeader.name,
    value: routeHeader.sensitive ? '' : routeHeader.value,
    sensitive: routeHeader.sensitive,
  };
}

function RouteContextSummary({ route }: RouteContextSummaryProps) {
  const { t } = useTranslation();

  if (!route) return null;

  return (
    <div className="space-y-3 rounded-md border border-border bg-surface p-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted">{t('routeHeaders.form.client')}</p>
          <p className="text-sm">{route.client.name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted">{t('routeHeaders.form.route')}</p>
          <p className="text-sm">{route.name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted">{t('routeHeaders.form.method')}</p>
          <MethodBadge method={route.method} />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted">{t('routeHeaders.table.publicEndpoint')}</p>
          <PublicEndpointField publicPath={route.publicPath} />
        </div>
      </div>
    </div>
  );
}

function toCreatePayload(
  values: CreateRouteHeaderFormValues,
  gatewayRouteId: string,
): CreateRouteHeaderPayload {
  return {
    gatewayRouteId,
    name: values.name,
    value: values.value,
    sensitive: values.sensitive,
  };
}

interface CreateRouteHeaderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (routeHeader: RouteHeader) => void;
}

export function CreateRouteHeaderForm({
  open,
  onOpenChange,
  onSuccess,
}: CreateRouteHeaderFormProps) {
  const { t } = useTranslation();
  const mutation = useCreateRouteHeader();
  const [gatewayRoute, setGatewayRoute] = useState<RouteHeaderGatewayRouteOption | null>(null);
  const [gatewayRouteError, setGatewayRouteError] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRouteHeaderFormValues>({
    resolver: zodResolver(createRouteHeaderSchema),
    defaultValues: {
      name: '',
      value: '',
      sensitive: false,
    },
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      reset();
      setGatewayRoute(null);
      setGatewayRouteError(false);
    }
    onOpenChange(next);
  }

  async function onSubmit(values: CreateRouteHeaderFormValues) {
    if (!gatewayRoute) {
      setGatewayRouteError(true);
      return;
    }

    try {
      const routeHeader = await mutation.mutateAsync(toCreatePayload(values, gatewayRoute.id));
      reset();
      setGatewayRoute(null);
      onSuccess(routeHeader);
    } catch {
      // Surfaced by mutation state.
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('routeHeaders.form.createTitle')}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <Combobox
              label={t('routeHeaders.form.gatewayRoute')}
              placeholder={t('routeHeaders.filters.gatewayRoutePlaceholder')}
              emptyMessage={t('routeHeaders.filters.gatewayRouteEmpty')}
              value={gatewayRoute}
              onChange={(next) => {
                setGatewayRoute(next);
                setGatewayRouteError(false);
              }}
              useOptions={useRouteHeaderGatewayRouteOptions}
              getOptionLabel={(option) =>
                `${option.client.name} - ${option.name} (${option.method})`
              }
              getOptionId={(option) => option.id}
            />
            {gatewayRouteError && (
              <p className="mt-1 text-sm text-destructive">
                {t('routeHeaders.form.errors.gatewayRouteRequired')}
              </p>
            )}
          </div>

          <RouteContextSummary route={gatewayRoute} />

          <div className="space-y-1.5">
            <label htmlFor="create-route-header-name" className="text-sm font-medium">
              {t('routeHeaders.form.name')}
            </label>
            <Input id="create-route-header-name" autoComplete="off" {...register('name')} />
            {errors.name?.message && (
              <p className="text-sm text-destructive">{t(errors.name.message)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="create-route-header-value" className="text-sm font-medium">
              {t('routeHeaders.form.value')}
            </label>
            <Input id="create-route-header-value" autoComplete="off" {...register('value')} />
            {errors.value?.message && (
              <p className="text-sm text-destructive">{t(errors.value.message)}</p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4" {...register('sensitive')} />
            {t('routeHeaders.form.sensitive')}
          </label>

          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {getApiErrorMessage(mutation.error, t('routeHeaders.error'))}
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
                : t('routeHeaders.form.submitCreate')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditRouteHeaderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routeHeader: RouteHeader;
  onSuccess: (routeHeader: RouteHeader) => void;
}

export function EditRouteHeaderForm({
  open,
  onOpenChange,
  routeHeader,
  onSuccess,
}: EditRouteHeaderFormProps) {
  const { t } = useTranslation();
  const mutation = useUpdateRouteHeader(routeHeader.id);
  const routeContextQuery = useRouteHeaderGatewayRoute(routeHeader.gatewayRouteId, open);

  const defaultValues = getEditDefaultValues(routeHeader);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UpdateRouteHeaderFormValues>({
    resolver: zodResolver(updateRouteHeaderSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(getEditDefaultValues(routeHeader));
  }, [reset, routeHeader]);

  function handleOpenChange(next: boolean) {
    if (!next) reset(defaultValues);
    onOpenChange(next);
  }

  async function onSubmit(values: UpdateRouteHeaderFormValues) {
    const payload: UpdateRouteHeaderPayload = {};
    const trimmedValue = values.value.trim();

    if (values.name !== defaultValues.name) payload.name = values.name;
    if (values.sensitive !== defaultValues.sensitive) payload.sensitive = values.sensitive;

    if (routeHeader.sensitive) {
      if (trimmedValue !== '') payload.value = trimmedValue;
    } else if (trimmedValue === '') {
      if (values.value !== defaultValues.value) {
        setError('value', { message: 'routeHeaders.form.errors.valueRequired' });
        return;
      }
    } else if (trimmedValue !== defaultValues.value) {
      payload.value = trimmedValue;
    }

    try {
      const result =
        Object.keys(payload).length > 0 ? await mutation.mutateAsync(payload) : routeHeader;
      onSuccess(result);
    } catch {
      // Surfaced by mutation state.
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('routeHeaders.form.editTitle')}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <RouteContextSummary route={routeContextQuery.data ?? null} />

          <div className="space-y-1.5">
            <label htmlFor="edit-route-header-name" className="text-sm font-medium">
              {t('routeHeaders.form.name')}
            </label>
            <Input id="edit-route-header-name" autoComplete="off" {...register('name')} />
            {errors.name?.message && (
              <p className="text-sm text-destructive">{t(errors.name.message)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-route-header-value" className="text-sm font-medium">
              {t('routeHeaders.form.value')}
            </label>
            <Input id="edit-route-header-value" autoComplete="off" {...register('value')} />
            {errors.value?.message && (
              <p className="text-sm text-destructive">{t(errors.value.message)}</p>
            )}
            {routeHeader.sensitive && (
              <p className="text-xs text-muted-foreground">
                {t('routeHeaders.form.keepCurrentValue')}
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4" {...register('sensitive')} />
            {t('routeHeaders.form.sensitive')}
          </label>

          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {getApiErrorMessage(mutation.error, t('routeHeaders.error'))}
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
              {mutation.isPending ? t('shared.confirm.loading') : t('routeHeaders.form.submitEdit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
