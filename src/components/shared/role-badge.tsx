import { useTranslation } from 'react-i18next';

import type { RoleCode } from '@/features/auth/auth.types';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  code: RoleCode;
}

const ROLE_BADGE_CLASSNAME: Record<RoleCode, string> = {
  ADMIN: 'bg-destructive/10 text-destructive',
  OPERATOR: 'bg-primary/10 text-primary',
  VIEWER: 'bg-accent text-accent-foreground',
  AUDITOR: 'bg-secondary text-secondary-foreground',
};

export function RoleBadge({ code }: RoleBadgeProps) {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        ROLE_BADGE_CLASSNAME[code],
      )}
    >
      {t(`auth.roles.${code}`)}
    </span>
  );
}
