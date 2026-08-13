import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { AllowedIpTypeBadge } from '@/components/allowed-ips/allowed-ip-type-badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import type { AllowedIp } from '@/features/allowed-ips/allowed-ips.types';

interface AllowedIpDetailsDrawerProps {
  open: boolean;
  allowedIp: AllowedIp | null;
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

export function AllowedIpDetailsDrawer({
  open,
  allowedIp,
  onOpenChange,
}: AllowedIpDetailsDrawerProps) {
  const { t, i18n } = useTranslation();

  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto p-6">
        <SheetTitle className="font-mono">{allowedIp?.address}</SheetTitle>
        <SheetDescription className="sr-only">{t('allowedIps.details.title')}</SheetDescription>

        {allowedIp && (
          <div className="mt-2">
            <DetailRow label={t('allowedIps.form.address')}>
              <span className="font-mono text-xs">{allowedIp.address}</span>
            </DetailRow>
            <DetailRow label={t('allowedIps.table.type')}>
              <AllowedIpTypeBadge type={allowedIp.type} />
            </DetailRow>
            <DetailRow label={t('allowedIps.table.client')}>{allowedIp.client.name}</DetailRow>
            <DetailRow label={t('allowedIps.form.description')}>
              {allowedIp.description ?? t('allowedIps.notAvailable')}
            </DetailRow>
            <DetailRow label={t('allowedIps.table.status')}>
              <StatusBadge active={allowedIp.active} />
            </DetailRow>
            <DetailRow label={t('allowedIps.table.createdAt')}>
              {dateFormatter.format(new Date(allowedIp.createdAt))}
            </DetailRow>
            <DetailRow label={t('allowedIps.table.updatedAt')}>
              {dateFormatter.format(new Date(allowedIp.updatedAt))}
            </DetailRow>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
