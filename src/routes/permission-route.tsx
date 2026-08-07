import { Navigate, Outlet } from 'react-router-dom';

import { usePermissions } from '@/features/auth/use-permissions';

interface PermissionRouteProps {
  permission: string;
}

/**
 * Client-side-only gate: hides a route when the role-derived permission map
 * says no. Not a security boundary — the backend's own guards are the real
 * authority and are re-checked on every request regardless of this route.
 */
export function PermissionRoute({ permission }: PermissionRouteProps) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
