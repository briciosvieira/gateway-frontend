import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

interface SensitiveBadgeProps {
  sensitive: boolean;
}

export function SensitiveBadge({ sensitive }: SensitiveBadgeProps) {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        sensitive
          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
          : 'bg-muted text-muted-foreground',
      )}
    >
      <span
        className={cn('size-1.5 rounded-full', sensitive ? 'bg-amber-500' : 'bg-muted-foreground')}
        aria-hidden="true"
      />
      {t(sensitive ? 'routeHeaders.sensitive.yes' : 'routeHeaders.sensitive.no')}
    </span>
  );
}
