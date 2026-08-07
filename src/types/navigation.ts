import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  key: string;
  labelKey: string;
  path: string;
  icon: LucideIcon;
  /** Role-derived permission required to see/access this item. Omitted means always visible. */
  permission?: string;
}
