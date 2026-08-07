import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types/navigation';

interface SidebarItemProps {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}

export function SidebarItem({ item, collapsed, onNavigate }: SidebarItemProps) {
  const { t } = useTranslation();
  const Icon = item.icon;

  const link = (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-surface hover:text-sidebar-foreground',
          collapsed && 'justify-center px-0',
          isActive && 'bg-primary/15 text-primary hover:bg-primary/15 hover:text-primary',
        )
      }
    >
      <Icon className="size-4.5 shrink-0" aria-hidden="true" />
      {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
    </NavLink>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{t(item.labelKey)}</TooltipContent>
    </Tooltip>
  );
}
