import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

interface HttpStatusBadgeProps {
  statusCode: number | null | undefined;
}

function getStatusStyles(statusCode: number | null | undefined): string {
  if (statusCode === null || statusCode === undefined) {
    return 'bg-muted text-muted-foreground';
  }

  if (statusCode >= 500) {
    return 'bg-rose-500/10 text-rose-700 dark:text-rose-300';
  }

  if (statusCode >= 400) {
    return 'bg-amber-500/10 text-amber-700 dark:text-amber-300';
  }

  if (statusCode >= 300) {
    return 'bg-blue-500/10 text-blue-700 dark:text-blue-300';
  }

  return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
}

export function HttpStatusBadge({ statusCode }: HttpStatusBadgeProps) {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        getStatusStyles(statusCode),
      )}
    >
      {statusCode ?? t('requestLogs.notAvailable')}
    </span>
  );
}
