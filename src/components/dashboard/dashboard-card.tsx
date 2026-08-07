import type { LucideIcon } from 'lucide-react';
import { memo, type ReactNode } from 'react';

import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardCardProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  description?: string;
  isLoading?: boolean;
}

function DashboardCardComponent({
  icon: Icon,
  label,
  value,
  description,
  isLoading,
}: DashboardCardProps) {
  return (
    <Card aria-label={label} className="min-h-27">
      <CardHeader className="flex-row items-center gap-2 space-y-0 p-4 pb-1">
        <Icon className="size-5 text-primary" aria-hidden="true" />
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {isLoading ? (
          <DashboardSkeleton className="h-7 w-16" />
        ) : (
          <p className="text-2xl font-semibold text-foreground">{value}</p>
        )}
        {description && <CardDescription className="mt-1">{description}</CardDescription>}
      </CardContent>
    </Card>
  );
}

export const DashboardCard = memo(DashboardCardComponent);
