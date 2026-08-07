import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface DashboardSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function DashboardSection({ title, children, className }: DashboardSectionProps) {
  return (
    <section className={cn('space-y-3', className)}>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}
