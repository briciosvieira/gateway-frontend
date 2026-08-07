interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 6 }: TableSkeletonProps) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }, (_, columnIndex) => (
            <div
              key={columnIndex}
              className="h-8 flex-1 animate-pulse rounded-md bg-surface-soft"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
