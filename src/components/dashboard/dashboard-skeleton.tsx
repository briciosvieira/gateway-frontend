import { cn } from '@/lib/utils';

interface DashboardSkeletonProps {
  className?: string;
}

export function DashboardSkeleton({ className }: DashboardSkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-md bg-surface-soft', className)} aria-hidden="true" />
  );
}
