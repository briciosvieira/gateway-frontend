import { useTranslation } from 'react-i18next';

import type { AuditAction } from '@/features/audit-logs/audit-logs.types';
import { cn } from '@/lib/utils';

const ACTION_STYLES: Record<AuditAction, string> = {
  CREATE: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  UPDATE: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  DELETE: 'bg-destructive/10 text-destructive',
  ACTIVATE: 'bg-primary/10 text-primary',
  DEACTIVATE: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  CHANGE_ROLE: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  RESET_PASSWORD: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  CHANGE_PASSWORD_REQUIREMENT: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  LOGIN: 'bg-lime-500/10 text-lime-700 dark:text-lime-300',
  LOGOUT: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
  REFRESH_TOKEN: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  REVOKE: 'bg-red-500/10 text-red-700 dark:text-red-300',
  REGENERATE: 'bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300',
};

interface AuditActionBadgeProps {
  action: AuditAction;
}

export function AuditActionBadge({ action }: AuditActionBadgeProps) {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        ACTION_STYLES[action],
      )}
    >
      {t(`auditLogs.actionsMap.${action}`)}
    </span>
  );
}
