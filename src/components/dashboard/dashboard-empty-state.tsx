import { Inbox } from 'lucide-react';

interface DashboardEmptyStateProps {
  message: string;
}

export function DashboardEmptyState({ message }: DashboardEmptyStateProps) {
  return (
    <div className="flex min-h-24 flex-col items-center justify-center gap-2 p-4 text-center text-sm text-muted">
      <Inbox className="size-6" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
