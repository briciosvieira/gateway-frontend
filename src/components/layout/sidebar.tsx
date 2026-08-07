import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppLogo } from '@/components/branding/app-logo';
import { SidebarFooter } from '@/components/layout/sidebar-footer';
import { SidebarItem } from '@/components/layout/sidebar-item';
import { SidebarUser } from '@/components/layout/sidebar-user';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/features/auth/use-permissions';
import { useSidebar } from '@/hooks/use-sidebar';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/routes/nav-items';

// Extra breathing room below the last nav item, on top of the footer's own
// measured height, so it doesn't end up flush against the footer's border.
const NAV_BOTTOM_GAP_PX = 12;

export function Sidebar() {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { hasPermission } = usePermissions();
  const { t } = useTranslation();

  // The footer's height changes with `isCollapsed` (SidebarFooter stacks its
  // controls vertically when collapsed) and with content/translation length,
  // so it's measured live rather than hard-coded — it sets how much bottom
  // padding the scrollable nav needs to let its last item clear the footer.
  const footerRef = useRef<HTMLElement>(null);
  const [footerHeight, setFooterHeight] = useState(0);

  useLayoutEffect(() => {
    const footerElement = footerRef.current;
    if (!footerElement) return;

    const observer = new ResizeObserver(([entry]) => {
      setFooterHeight(entry.contentRect.height);
    });
    observer.observe(footerElement);

    return () => observer.disconnect();
  }, []);

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );

  return (
    <aside
      className={cn(
        'hidden h-dvh shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex',
        isCollapsed ? 'w-18' : 'w-60',
      )}
    >
      <header className="flex h-18 shrink-0 items-center justify-center border-b border-sidebar-border px-4">
        <AppLogo collapsed={isCollapsed} />
      </header>

      {/* Fills the remaining height below the header; nav and footer are
          stacked within it via absolute positioning so nav can scroll its
          full height "behind" the footer instead of stopping above it. */}
      <div className="relative min-h-0 flex-1">
        <nav
          className="hide-scrollbar absolute inset-0 space-y-1 overflow-x-hidden overflow-y-auto px-3 pt-3"
          style={{ paddingBottom: footerHeight + NAV_BOTTOM_GAP_PX }}
        >
          {visibleNavItems.map((item) => (
            <SidebarItem key={item.key} item={item} collapsed={isCollapsed} />
          ))}
        </nav>

        <footer
          ref={footerRef}
          className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 border-t border-sidebar-border bg-sidebar px-3 py-3"
        >
          <SidebarUser collapsed={isCollapsed} />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t(isCollapsed ? 'sidebar.expand' : 'sidebar.collapse')}
            onClick={toggleSidebar}
            className={cn(isCollapsed ? 'self-center' : 'self-end')}
          >
            {isCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>

          <SidebarFooter collapsed={isCollapsed} />
        </footer>
      </div>
    </aside>
  );
}
