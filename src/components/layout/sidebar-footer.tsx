import { LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { LanguageSelector } from '@/components/language/language-selector';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLogout } from '@/features/auth/use-logout';
import { cn } from '@/lib/utils';

interface SidebarFooterProps {
  collapsed: boolean;
  /** Omitted on `MobileSidebar` (a Sheet has no collapse/expand concept of its own). */
  onToggleSidebar?: () => void;
}

/**
 * All footer utility controls in one aligned group: language, theme and
 * collapse/expand form the "settings" cluster, logout sits at the opposite
 * end of the same row — never its own separate row, so it reads as part of
 * the group instead of floating disconnected from it. Collapses to a single
 * centered icon column when the Sidebar itself is collapsed.
 */
export function SidebarFooter({ collapsed, onToggleSidebar }: SidebarFooterProps) {
  const { t } = useTranslation();
  const { submit, isLoggingOut } = useLogout();

  const logoutButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={t('sidebar.footer.logout')}
      disabled={isLoggingOut}
      onClick={submit}
    >
      {isLoggingOut ? (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : (
        <LogOut />
      )}
    </Button>
  );

  return (
    <div className={cn('flex items-center gap-1', collapsed ? 'flex-col' : 'justify-between')}>
      <div className={cn('flex items-center gap-1', collapsed && 'flex-col')}>
        <LanguageSelector />
        <ThemeToggle />

        {onToggleSidebar && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t(collapsed ? 'sidebar.expand' : 'sidebar.collapse')}
                onClick={onToggleSidebar}
              >
                {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side={collapsed ? 'right' : 'top'}>
              {t(collapsed ? 'sidebar.expand' : 'sidebar.collapse')}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <Tooltip>
        <TooltipTrigger asChild>{logoutButton}</TooltipTrigger>
        <TooltipContent side={collapsed ? 'right' : 'top'}>
          {t('sidebar.footer.logout')}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
