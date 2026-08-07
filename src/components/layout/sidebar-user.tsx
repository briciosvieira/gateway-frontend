import { useTranslation } from 'react-i18next';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/features/auth/use-auth';

interface SidebarUserProps {
  collapsed: boolean;
}

export function SidebarUser({ collapsed }: SidebarUserProps) {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (!user) return null;

  const initial = user.name.charAt(0).toUpperCase();
  const roleLabel = t(`auth.roles.${user.role.code}`);

  const avatar = (
    <div
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
      aria-hidden="true"
    >
      {initial}
    </div>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex justify-center">{avatar}</div>
        </TooltipTrigger>
        <TooltipContent side="right">
          {user.name} — {roleLabel}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-2 overflow-hidden px-1">
      {avatar}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</p>
        <p className="truncate text-xs text-sidebar-muted">{roleLabel}</p>
      </div>
    </div>
  );
}
