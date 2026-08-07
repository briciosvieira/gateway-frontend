import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

interface SidebarContextValue {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

const SIDEBAR_STORAGE_KEY = 'gateway-hub-lf-sidebar';

function getInitialCollapsed(): boolean {
  if (typeof window === 'undefined') return false;

  return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'collapsed';
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
