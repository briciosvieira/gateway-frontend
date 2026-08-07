import { useAuth } from '@/features/auth/use-auth';

/**
 * Thin selector over AuthContext. Does not call the network — permissions
 * are derived client-side from the role (see role-permissions.ts) because
 * GET /auth/permissions does not exist on the backend.
 */
export function usePermissions() {
  const { permissions, hasPermission } = useAuth();

  return { permissions, hasPermission };
}
