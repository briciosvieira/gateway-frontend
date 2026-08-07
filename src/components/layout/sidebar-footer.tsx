import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { LanguageSelector } from '@/components/language/language-selector';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLogout } from '@/features/auth/use-logout';
import { cn } from '@/lib/utils';

interface SidebarFooterProps {
  collapsed: boolean;
}

export function SidebarFooter({ collapsed }: SidebarFooterProps) {
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
