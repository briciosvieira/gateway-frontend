import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { AuditActionBadge } from '@/components/audit-logs/audit-action-badge';
import { AuditEntityBadge } from '@/components/audit-logs/audit-entity-badge';
import { CopyField } from '@/components/shared/copy-field';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { formatAuditJson } from '@/features/audit-logs/audit-log-sanitizer';
import type { AuditLog, JsonValue } from '@/features/audit-logs/audit-logs.types';
import { useAuditLog } from '@/features/audit-logs/hooks/use-audit-logs';
import { getApiErrorMessage } from '@/lib/api/api-response';

interface AuditLogDetailsDrawerProps {
  open: boolean;
  auditLog: AuditLog | null;
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

interface AuditJsonBlockProps {
  label: string;
  value: JsonValue | null;
}

function AuditJsonBlock({ label, value }: AuditJsonBlockProps) {
  return (
    <DetailRow label={label}>
      <div className="overflow-x-auto rounded-md border border-border bg-surface p-3">
        <pre className="font-mono text-xs whitespace-pre-wrap break-words">
          {formatAuditJson(value)}
        </pre>
      </div>
    </DetailRow>
  );
}

export function AuditLogDetailsDrawer({
  open,
  auditLog,
  onOpenChange,
}: AuditLogDetailsDrawerProps) {
  const { t, i18n } = useTranslation();
  const auditLogQuery = useAuditLog(auditLog?.id, open);
  const currentAuditLog = auditLogQuery.data ?? auditLog;

  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto p-6 sm:max-w-xl">
        <SheetTitle>{t('auditLogs.details.title')}</SheetTitle>
        <SheetDescription className="sr-only">{t('auditLogs.details.title')}</SheetDescription>

        {auditLogQuery.isError && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {getApiErrorMessage(auditLogQuery.error, t('auditLogs.error'))}
          </p>
        )}

        {currentAuditLog && (
          <div className="mt-2">
            <DetailRow label={t('auditLogs.table.date')}>
              {dateFormatter.format(new Date(currentAuditLog.createdAt))}
            </DetailRow>

            <DetailRow label={t('auditLogs.table.user')}>
              {currentAuditLog.user?.name ?? t('auditLogs.removedUser')}
            </DetailRow>

            <DetailRow label={t('auditLogs.details.username')}>
              {currentAuditLog.user?.username ?? t('auditLogs.notAvailable')}
            </DetailRow>

            <DetailRow label={t('auditLogs.details.role')}>
              {currentAuditLog.user?.role.name ?? t('auditLogs.notAvailable')}
            </DetailRow>

            <DetailRow label={t('auditLogs.table.action')}>
              <AuditActionBadge action={currentAuditLog.action} />
            </DetailRow>

            <DetailRow label={t('auditLogs.table.entity')}>
              <AuditEntityBadge entity={currentAuditLog.entity} />
            </DetailRow>

            <DetailRow label={t('auditLogs.details.entityId')}>
              {currentAuditLog.entityId ? (
                <CopyField value={currentAuditLog.entityId} />
              ) : (
                t('auditLogs.notAvailable')
              )}
            </DetailRow>

            <DetailRow label={t('auditLogs.table.description')}>
              {currentAuditLog.description ?? t('auditLogs.notAvailable')}
            </DetailRow>

            <DetailRow label={t('auditLogs.table.sourceIp')}>
              {currentAuditLog.sourceIp ?? t('auditLogs.notAvailable')}
            </DetailRow>

            <DetailRow label={t('auditLogs.details.requestId')}>
              {currentAuditLog.requestId ? (
                <CopyField value={currentAuditLog.requestId} />
              ) : (
                t('auditLogs.notAvailable')
              )}
            </DetailRow>

            <AuditJsonBlock
              label={t('auditLogs.details.previousValue')}
              value={currentAuditLog.previousValue}
            />

            <AuditJsonBlock
              label={t('auditLogs.details.newValue')}
              value={currentAuditLog.newValue}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
