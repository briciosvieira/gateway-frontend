import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/use-auth';

export function useLogout() {
  const { logout, isLoggingOut } = useAuth();
  const navigate = useNavigate();

  const submit = useCallback(async () => {
    await logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  return { submit, isLoggingOut };
}
