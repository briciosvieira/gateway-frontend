import { useTranslation } from 'react-i18next';

import type { AuditEntity } from '@/features/audit-logs/audit-logs.types';
import { cn } from '@/lib/utils';

const ENTITY_STYLES: Record<AuditEntity, string> = {
  USER: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  ROLE: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  CLIENT: 'bg-teal-500/10 text-teal-700 dark:text-teal-300',
  API_KEY: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300',
  ALLOWED_IP: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  GATEWAY_ROUTE: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  ROUTE_HEADER: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
  SYSTEM_SETTING: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
};

interface AuditEntityBadgeProps {
  entity: AuditEntity;
}

export function AuditEntityBadge({ entity }: AuditEntityBadgeProps) {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        ENTITY_STYLES[entity],
      )}
    >
      {t(`auditLogs.entitiesMap.${entity}`)}
    </span>
  );
}
