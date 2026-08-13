import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
} from 'react';

import { AppLogo } from '@/components/branding/app-logo';
import { SidebarFooter } from '@/components/layout/sidebar-footer';
import { SidebarItem } from '@/components/layout/sidebar-item';
import { isInsideSidebarPopover } from '@/components/layout/sidebar-popover';
import { SidebarUser } from '@/components/layout/sidebar-user';
import { usePermissions } from '@/features/auth/use-permissions';
import { useSupportsHover } from '@/hooks/use-supports-hover';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/routes/nav-items';

// Extra breathing room below the last nav item, on top of the footer's own
// measured height, so it doesn't end up flush against the footer's border.
const NAV_BOTTOM_GAP_PX = 16;

// How long the pointer can be away from the Sidebar before it auto-collapses
// back to the compact rail — long enough to survive a brief overshoot while
// moving toward an item, short enough that it doesn't feel stuck open.
const HOVER_CLOSE_DELAY_MS = 300;

export function Sidebar() {
  const { hasPermission } = usePermissions();
  const supportsHover = useSupportsHover();

  // The footer's height changes with the compact/expanded width (SidebarFooter
  // stacks its controls vertically while compact) and with content/
  // translation length, so it's measured live rather than hard-coded — it
  // sets how much bottom padding the scrollable nav needs to let its last
  // item clear the footer.
  const footerRef = useRef<HTMLElement>(null);
  const [footerHeight, setFooterHeight] = useState(0);

  useLayoutEffect(() => {
    const footerElement = footerRef.current;
    if (!footerElement) return;

    // `entry.contentRect` is the content-box only (excludes the footer's own
    // padding/border), which under-measures its real rendered height and
    // left the last nav item still peeking out from behind it — read
    // `offsetHeight` (border-box) from the element itself instead.
    const observer = new ResizeObserver(() => {
      setFooterHeight(footerElement.offsetHeight);
    });
    observer.observe(footerElement);

    return () => observer.disconnect();
  }, []);

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );

  const [isHoverOpen, setIsHoverOpen] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearCloseTimeout() {
    if (closeTimeoutRef.current !== null) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }

  useEffect(() => clearCloseTimeout, []);

  function handleMouseEnter() {
    clearCloseTimeout();
    setIsHoverOpen(true);
  }

  function handleMouseLeave(event: MouseEvent<HTMLElement>) {
    if (isInsideSidebarPopover(event.relatedTarget as Node | null)) {
      return;
    }

    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => setIsHoverOpen(false), HOVER_CLOSE_DELAY_MS);
  }

  // Keyboard users tabbing into the Sidebar must be able to see what's
  // focused without ever touching the mouse — focus-within keeps it
  // expanded exactly like hover does, and collapses it again once focus
  // moves elsewhere (e.g. tabbing past the last footer control).
  function handleFocus() {
    clearCloseTimeout();
    setIsFocusWithin(true);
  }

  function handleBlur(event: FocusEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsFocusWithin(false);
    }
  }

  // Touch/coarse-pointer devices (tablets) have no hover at all — they get
  // the Sidebar permanently expanded (full labels, docked) instead, since
  // there's no gesture to ever reveal a compact rail's labels otherwise.
  // Everyone else starts compact and expands only while the pointer/focus
  // is actually on the Sidebar.
  const isExpanded = !supportsHover || isHoverOpen || isFocusWithin;
  const collapsedForChildren = !isExpanded;

  const asideContent = (
    <>
      <header className="flex h-18 shrink-0 items-center justify-center border-b border-nav-sidebar-border px-4">
        <AppLogo collapsed={collapsedForChildren} />
      </header>

      <div className="relative min-h-0 flex-1">
        <nav
          className="hide-scrollbar absolute inset-0 space-y-1 overflow-x-hidden overflow-y-auto px-3 pt-3"
          style={{ paddingBottom: footerHeight + NAV_BOTTOM_GAP_PX }}
        >
          {visibleNavItems.map((item) => (
            <SidebarItem key={item.key} item={item} collapsed={collapsedForChildren} />
          ))}
        </nav>

        <footer
          ref={footerRef}
          className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 border-t border-nav-sidebar-border bg-nav-sidebar px-3 py-3"
        >
          <SidebarUser collapsed={collapsedForChildren} />
          <SidebarFooter collapsed={collapsedForChildren} />
        </footer>
      </div>
    </>
  );

  if (!supportsHover) {
    return (
      <aside className="hidden h-dvh w-60 shrink-0 flex-col overflow-hidden border-r border-nav-sidebar-border bg-nav-sidebar text-nav-sidebar-foreground md:flex">
        {asideContent}
      </aside>
    );
  }

  // A real flex sibling — not a `fixed`/overlay element — so that toggling
  // its width between the compact and expanded tokens directly reflows the
  // rest of the layout (the main content area is `flex-1 min-w-0` in
  // `AppShell`, so it shrinks/grows in sync instead of ever being covered).
  return (
    <aside
      className={cn(
        'hidden h-dvh shrink-0 flex-col overflow-hidden border-r border-nav-sidebar-border bg-nav-sidebar text-nav-sidebar-foreground transition-[width] duration-200 ease-out md:flex',
        isExpanded ? 'w-60' : 'w-18',
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {asideContent}
    </aside>
  );
}
