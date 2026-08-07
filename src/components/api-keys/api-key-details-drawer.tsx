import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { StatusBadge } from '@/components/shared/status-badge';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import type { ApiKey } from '@/features/api-keys/api-keys.types';

interface ApiKeyDetailsDrawerProps {
  open: boolean;
  apiKey: ApiKey | null;
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

export function ApiKeyDetailsDrawer({ open, apiKey, onOpenChange }: ApiKeyDetailsDrawerProps) {
  const { t, i18n } = useTranslation();

  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  function formatDate(value: string | null) {
    return value ? dateFormatter.format(new Date(value)) : t('apiKeys.notAvailable');
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto p-6">
        <SheetTitle>{apiKey?.name}</SheetTitle>
        <SheetDescription className="sr-only">{t('apiKeys.details.title')}</SheetDescription>

        {apiKey && (
          <div className="mt-2">
            <DetailRow label={t('apiKeys.form.name')}>{apiKey.name}</DetailRow>
            <DetailRow label={t('apiKeys.table.client')}>{apiKey.client.name}</DetailRow>
            <DetailRow label={t('apiKeys.table.status')}>
              <StatusBadge active={apiKey.active} />
            </DetailRow>
            <DetailRow label={t('apiKeys.table.expiresAt')}>
              {formatDate(apiKey.expiresAt)}
            </DetailRow>
            <DetailRow label={t('apiKeys.table.revoked')}>
              {t(apiKey.revokedAt !== null ? 'apiKeys.table.yes' : 'apiKeys.table.no')}
            </DetailRow>
            <DetailRow label={t('apiKeys.table.createdAt')}>
              {formatDate(apiKey.createdAt)}
            </DetailRow>
            <DetailRow label={t('apiKeys.details.updatedAt')}>
              {formatDate(apiKey.updatedAt)}
            </DetailRow>
            <DetailRow label={t('apiKeys.table.lastUsedAt')}>
              {formatDate(apiKey.lastUsedAt)}
            </DetailRow>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
