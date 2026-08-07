import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

interface CertificateTypeBadgeProps {
  isRoot: boolean;
}

/**
 * `isRoot` is exactly `subject === issuer` as computed by the backend
 * (self-signed). Anything else is just labeled "CA" — never invent an
 * "Intermediate CA" label, the backend doesn't provide enough information
 * to classify that distinctly.
 */
export function CertificateTypeBadge({ isRoot }: CertificateTypeBadgeProps) {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        isRoot ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
      )}
    >
      {t(isRoot ? 'settings.certificates.type.root' : 'settings.certificates.type.ca')}
    </span>
  );
}
