import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { StatusBadge } from '@/components/shared/status-badge';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import type { Client } from '@/features/clients/clients.types';

interface ClientDetailsDrawerProps {
  open: boolean;
  client: Client | null;
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

export function ClientDetailsDrawer({ open, client, onOpenChange }: ClientDetailsDrawerProps) {
  const { t, i18n } = useTranslation();

  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto p-6">
        <SheetTitle>{client?.name}</SheetTitle>
        <SheetDescription className="sr-only">{t('clients.details.title')}</SheetDescription>

        {client && (
          <div className="mt-2">
            <DetailRow label={t('clients.form.name')}>{client.name}</DetailRow>
            <DetailRow label={t('clients.form.code')}>
              <span className="font-mono text-xs">{client.code}</span>
            </DetailRow>
            <DetailRow label={t('clients.form.description')}>
              {client.description ?? t('clients.notAvailable')}
            </DetailRow>
            <DetailRow label={t('clients.form.contactName')}>
              {client.contactName ?? t('clients.notAvailable')}
            </DetailRow>
            <DetailRow label={t('clients.form.contactEmail')}>
              {client.contactEmail ?? t('clients.notAvailable')}
            </DetailRow>
            <DetailRow label={t('clients.table.status')}>
              <StatusBadge active={client.active} />
            </DetailRow>
            <DetailRow label={t('clients.table.createdAt')}>
              {dateFormatter.format(new Date(client.createdAt))}
            </DetailRow>
            <DetailRow label={t('clients.table.updatedAt')}>
              {dateFormatter.format(new Date(client.updatedAt))}
            </DetailRow>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
