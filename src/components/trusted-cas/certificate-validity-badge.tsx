import { useTranslation } from 'react-i18next';

import { getCertificateValidityStatus } from '@/features/trusted-cas/trusted-cas.utils';
import { cn } from '@/lib/utils';

interface CertificateValidityBadgeProps {
  validTo: string;
}

const VALIDITY_BADGE_CLASSNAME = {
  valid: 'bg-primary/10 text-primary',
  expiring: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  expired: 'bg-destructive/10 text-destructive',
} as const;

/**
 * Purely visual, derived client-side from `validTo` — never affects the
 * record's real `active` status and never triggers a mutation. See
 * `getCertificateValidityStatus` for the exact 30-day threshold rule.
 */
export function CertificateValidityBadge({ validTo }: CertificateValidityBadgeProps) {
  const { t } = useTranslation();
  const status = getCertificateValidityStatus(validTo);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        VALIDITY_BADGE_CLASSNAME[status],
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          status === 'valid' && 'bg-primary',
          status === 'expiring' && 'bg-amber-500',
          status === 'expired' && 'bg-destructive',
        )}
        aria-hidden="true"
      />
      {t(`settings.certificates.validity.${status}`)}
    </span>
  );
}
