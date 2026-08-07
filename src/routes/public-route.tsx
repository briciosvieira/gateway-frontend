import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { AuthLoadingScreen } from '@/components/auth/auth-loading-screen';
import { useAuth } from '@/features/auth/use-auth';

interface LocationState {
  from?: string;
}

export function PublicRoute() {
  const { isAuthenticated, isInitializing, mustChangePassword } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <AuthLoadingScreen />;
  }

  if (isAuthenticated) {
    const from = (location.state as LocationState | null)?.from;
    return <Navigate to={mustChangePassword ? '/change-password' : (from ?? '/')} replace />;
  }

  return <Outlet />;
}
