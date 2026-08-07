import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { MethodBadge } from '@/components/gateway-routes/method-badge';
import { PublicEndpointField } from '@/components/gateway-routes/public-endpoint-field';
import { SensitiveBadge } from '@/components/route-headers/sensitive-badge';
import { CopyField } from '@/components/shared/copy-field';
import { StatusBadge } from '@/components/shared/status-badge';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { MASKED_ROUTE_HEADER_VALUE } from '@/features/route-headers/route-headers.constants';
import {
  useRouteHeader,
  useRouteHeaderGatewayRoute,
} from '@/features/route-headers/route-headers.hooks';
import type { RouteHeader } from '@/features/route-headers/route-headers.types';

interface RouteHeaderDetailsDrawerProps {
  open: boolean;
  routeHeader: RouteHeader | null;
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

export function RouteHeaderDetailsDrawer({
  open,
  routeHeader,
  onOpenChange,
}: RouteHeaderDetailsDrawerProps) {
  const { t, i18n } = useTranslation();
  const routeHeaderQuery = useRouteHeader(open ? routeHeader?.id : undefined);
  const currentHeader = routeHeaderQuery.data ?? routeHeader;
  const routeContextQuery = useRouteHeaderGatewayRoute(currentHeader?.gatewayRouteId, open);

  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto p-6">
        <SheetTitle>{currentHeader?.name}</SheetTitle>
        <SheetDescription className="sr-only">{t('routeHeaders.details.title')}</SheetDescription>

        {currentHeader && (
          <div className="mt-2">
            <DetailRow label={t('routeHeaders.form.name')}>{currentHeader.name}</DetailRow>
            <DetailRow label={t('routeHeaders.table.gatewayRoute')}>
              {routeContextQuery.data?.name ?? t('routeHeaders.notAvailable')}
            </DetailRow>
            <DetailRow label={t('routeHeaders.table.client')}>
              {routeContextQuery.data?.client.name ?? t('routeHeaders.notAvailable')}
            </DetailRow>
            <DetailRow label={t('routeHeaders.form.method')}>
              {routeContextQuery.data ? (
                <MethodBadge method={routeContextQuery.data.method} />
              ) : (
                t('routeHeaders.notAvailable')
              )}
            </DetailRow>
            <DetailRow label={t('routeHeaders.table.publicEndpoint')}>
              {routeContextQuery.data ? (
                <PublicEndpointField publicPath={routeContextQuery.data.publicPath} />
              ) : (
                t('routeHeaders.notAvailable')
              )}
            </DetailRow>
            <DetailRow label={t('routeHeaders.table.sensitive')}>
              <SensitiveBadge sensitive={currentHeader.sensitive} />
            </DetailRow>
            <DetailRow label={t('routeHeaders.form.value')}>
              {currentHeader.sensitive ? (
                <span className="font-mono text-xs">{MASKED_ROUTE_HEADER_VALUE}</span>
              ) : (
                <CopyField value={currentHeader.value} />
              )}
            </DetailRow>
            <DetailRow label={t('routeHeaders.table.status')}>
              <StatusBadge active={currentHeader.active} />
            </DetailRow>
            <DetailRow label={t('routeHeaders.table.createdAt')}>
              {dateFormatter.format(new Date(currentHeader.createdAt))}
            </DetailRow>
            <DetailRow label={t('routeHeaders.table.updatedAt')}>
              {dateFormatter.format(new Date(currentHeader.updatedAt))}
            </DetailRow>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
