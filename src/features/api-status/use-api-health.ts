import { useQuery } from '@tanstack/react-query';

import { getHealth } from '@/services/health/health.service';

export function useApiHealth() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => getHealth(signal),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return { data, isLoading, isError, error, refetch };
}
