import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

interface SidebarContextValue {
  /**
   * `true` (the default for anyone without a stored preference) means the
   * desktop Sidebar is NOT pinned — it stays hidden until hovered/focused
   * (see `Sidebar.tsx`). `false` means it's pinned permanently open/docked,
   * same as the classic always-visible behavior this app had before.
   */
  isCollapsed: boolean;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

const SIDEBAR_STORAGE_KEY = 'gateway-hub-lf-sidebar';

function getInitialCollapsed(): boolean {
  if (typeof window === 'undefined') return true;

  const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
  if (stored === 'expanded') return false;
  if (stored === 'collapsed') return true;

  // No stored preference yet: hover-capable desktops default to the new
  // hover-only behavior (closed). Touch/coarse-pointer devices (tablets)
  // keep this app's original default (always visible, expanded) — the
  // hover feature never applies to them, so there's nothing to default
  // "closed" into.
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches
  );
}

export const SidebarContext = createContext<SidebarContextValue | null>(null);

interface SidebarProviderProps {
  children: ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(getInitialCollapsed);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, isCollapsed ? 'collapsed' : 'expanded');
  }, [isCollapsed]);

  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((current) => !current);
  }, []);

  const value = useMemo(
    () => ({ isCollapsed, toggleSidebar, setCollapsed }),
    [isCollapsed, toggleSidebar, setCollapsed],
  );

  return <SidebarContext value={value}>{children}</SidebarContext>;
}
