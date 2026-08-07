import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  active: boolean;
}

/**
 * Status is always conveyed via the text label, never color alone — the dot
 * is a redundant visual cue for quick scanning, not the only signal.
 */
export function StatusBadge({ active }: StatusBadgeProps) {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        active ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive',
      )}
    >
      <span
        className={cn('size-1.5 rounded-full', active ? 'bg-primary' : 'bg-destructive')}
        aria-hidden="true"
      />
      {t(active ? 'shared.status.active' : 'shared.status.inactive')}
    </span>
  );
}
