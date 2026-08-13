import { useTranslation } from 'react-i18next';

import type { AllowedIpType } from '@/features/allowed-ips/allowed-ips.types';
import { cn } from '@/lib/utils';

interface AllowedIpTypeBadgeProps {
  type: AllowedIpType;
}

const TYPE_BADGE_STYLES: Record<AllowedIpType, string> = {
  IPV4: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
  IPV6: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
  CIDR_IPV4: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  CIDR_IPV6: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  HOSTNAME: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
};

/** Compact, purely categorical badge — not a status/warning, just IP vs CIDR vs DNS (hostname). */
export function AllowedIpTypeBadge({ type }: AllowedIpTypeBadgeProps) {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        TYPE_BADGE_STYLES[type],
      )}
    >
      {t(`allowedIps.types.${type}`)}
    </span>
  );
}
