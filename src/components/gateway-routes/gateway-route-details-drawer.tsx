import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { MethodBadge } from '@/components/gateway-routes/method-badge';
import { PublicEndpointField } from '@/components/gateway-routes/public-endpoint-field';
import { StatusBadge } from '@/components/shared/status-badge';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import type { GatewayRoute } from '@/features/gateway-routes/gateway-routes.types';

interface GatewayRouteDetailsDrawerProps {
  open: boolean;
  route: GatewayRoute | null;
  onOpenChange: (open: boolean) => void;
}

interface DetailRowProps {
  label: string;
  children: ReactNode;
}

function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className="space-y-1 border-b border-sidebar-border py-3">
      <p className="text-xs font-medium text-sidebar-muted">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function GatewayRouteDetailsDrawer({
  open,
  route,
  onOpenChange,
}: GatewayRouteDetailsDrawerProps) {
  const { t, i18n } = useTranslation();

  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto p-6">
        <SheetTitle>{route?.name}</SheetTitle>
        <SheetDescription className="sr-only">{t('gatewayRoutes.details.title')}</SheetDescription>

        {route && (
          <div className="mt-2">
            <DetailRow label={t('gatewayRoutes.form.name')}>{route.name}</DetailRow>
            <DetailRow label={t('gatewayRoutes.table.client')}>{route.client.name}</DetailRow>
            <DetailRow label={t('gatewayRoutes.form.description')}>
              {route.description ?? t('gatewayRoutes.notAvailable')}
            </DetailRow>
            <DetailRow label={t('gatewayRoutes.form.method')}>
              <MethodBadge method={route.method} />
            </DetailRow>
            <DetailRow label={t('gatewayRoutes.form.slug')}>
              <span className="font-mono text-xs">{route.slug}</span>
            </DetailRow>
            <DetailRow label={t('gatewayRoutes.table.publicEndpoint')}>
              <PublicEndpointField publicPath={route.publicPath} />
            </DetailRow>
            <DetailRow label={t('gatewayRoutes.form.destinationUrl')}>
              <span className="font-mono text-xs break-all">{route.destinationUrl}</span>
            </DetailRow>
            <DetailRow label={t('gatewayRoutes.form.timeoutMs')}>
              {t('gatewayRoutes.table.timeoutValue', { ms: route.timeoutMs })}
            </DetailRow>
            <DetailRow label={t('gatewayRoutes.form.retryCount')}>{route.retryCount}</DetailRow>
            <DetailRow label={t('gatewayRoutes.table.status')}>
              <StatusBadge active={route.active} />
            </DetailRow>
            <DetailRow label={t('gatewayRoutes.table.createdAt')}>
              {dateFormatter.format(new Date(route.createdAt))}
            </DetailRow>
            <DetailRow label={t('gatewayRoutes.table.updatedAt')}>
              {dateFormatter.format(new Date(route.updatedAt))}
            </DetailRow>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
