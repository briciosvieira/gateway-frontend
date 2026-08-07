import { Navigate, Outlet } from 'react-router-dom';

import { AuthLoadingScreen } from '@/components/auth/auth-loading-screen';
import { useAuth } from '@/features/auth/use-auth';

/**
 * Guards /change-password. Reachable by any authenticated user, not only
 * those with mustChangePassword — a first-login user is forced here by
 * ProtectedRoute, but nothing stops an already-onboarded user from
 * reaching it voluntarily in the future (e.g. from a profile page). Only
 * unauthenticated visitors are denied, sent to /login instead.
 */
export function FirstLoginRoute() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
