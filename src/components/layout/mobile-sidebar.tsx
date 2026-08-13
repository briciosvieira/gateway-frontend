import { Menu } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppLogo } from '@/components/branding/app-logo';
import { SidebarFooter } from '@/components/layout/sidebar-footer';
import { SidebarItem } from '@/components/layout/sidebar-item';
import { SidebarUser } from '@/components/layout/sidebar-user';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { usePermissions } from '@/features/auth/use-permissions';
import { useBranding } from '@/features/branding/branding.hooks';
import { NAV_ITEMS } from '@/routes/nav-items';

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const { branding } = useBranding();

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={t('sidebar.openMenu')}>
          <Menu />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-72 bg-nav-sidebar p-0 text-nav-sidebar-foreground">
        <SheetTitle className="sr-only">{branding.applicationName}</SheetTitle>

        <div className="flex h-16 items-center px-3">
          <AppLogo />
        </div>

        <Separator className="bg-nav-sidebar-border" />

        <nav className="hide-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {visibleNavItems.map((item) => (
            <SidebarItem
              key={item.key}
              item={item}
              collapsed={false}
              onNavigate={() => setOpen(false)}
            />
          ))}
        </nav>

        <Separator className="bg-nav-sidebar-border" />

        <div className="flex flex-col gap-2 p-3">
          <SidebarUser collapsed={false} />
          <SidebarFooter collapsed={false} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
