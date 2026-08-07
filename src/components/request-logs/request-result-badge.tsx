import { useTranslation } from 'react-i18next';

import type { RequestLogResult } from '@/features/request-logs/request-logs.types';
import { cn } from '@/lib/utils';

interface RequestResultBadgeProps {
  result: RequestLogResult;
}

const RESULT_STYLES: Record<RequestLogResult, string> = {
  SUCCESS: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  ERROR: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
};

export function RequestResultBadge({ result }: RequestResultBadgeProps) {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        RESULT_STYLES[result],
      )}
    >
      {t(`requestLogs.results.${result}`)}
    </span>
  );
}
