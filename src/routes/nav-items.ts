import {
  Activity,
  Braces,
  Building2,
  ClipboardList,
  House,
  KeyRound,
  LayoutDashboard,
  Route as RouteIcon,
  Settings,
  ShieldCheck,
} from 'lucide-react';

import type { NavItem } from '@/types/navigation';

/** Usuários lives under Configurações now (`/settings/users`) — see `SETTINGS_NAV_ITEMS` — not in the main Sidebar. */
export const NAV_ITEMS: NavItem[] = [
  { key: 'home', labelKey: 'nav.home', path: '/', icon: House },
  { key: 'dashboard', labelKey: 'nav.dashboard', path: '/dashboard', icon: LayoutDashboard },
  { key: 'clients', labelKey: 'nav.clients', path: '/clients', icon: Building2 },
  { key: 'apiKeys', labelKey: 'nav.apiKeys', path: '/api-keys', icon: KeyRound },
  { key: 'allowedIps', labelKey: 'nav.allowedIps', path: '/allowed-ips', icon: ShieldCheck },
  {
    key: 'gatewayRoutes',
    labelKey: 'nav.gatewayRoutes',
    path: '/gateway-routes',
    icon: RouteIcon,
  },
  {
    key: 'routeHeaders',
    labelKey: 'nav.routeHeaders',
    path: '/route-headers',
    icon: Braces,
    permission: 'routeHeaders.read',
  },
  {
    key: 'auditLogs',
    labelKey: 'nav.auditLogs',
    path: '/audit-logs',
    icon: ClipboardList,
    permission: 'auditLogs.read',
  },
  {
    key: 'requestLogs',
    labelKey: 'nav.requestLogs',
    path: '/request-logs',
    icon: Activity,
    permission: 'requestLogs.read',
  },
  {
    key: 'settings',
    labelKey: 'nav.settings',
    path: '/settings',
    icon: Settings,
    permission: 'settings.read',
  },
];
