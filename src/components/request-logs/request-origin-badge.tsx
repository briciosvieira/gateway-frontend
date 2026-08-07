import { useTranslation } from 'react-i18next';

import type { RequestOrigin } from '@/features/request-logs/request-logs.types';
import { cn } from '@/lib/utils';

interface RequestOriginBadgeProps {
  origin: RequestOrigin;
}

const ORIGIN_STYLES: Record<RequestOrigin, string> = {
  PUBLIC: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  INTERNAL: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
};

export function RequestOriginBadge({ origin }: RequestOriginBadgeProps) {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        ORIGIN_STYLES[origin],
      )}
    >
      {t(`requestLogs.origins.${origin}`)}
    </span>
  );
}
