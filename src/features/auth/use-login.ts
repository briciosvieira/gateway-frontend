import { useCallback, useState } from 'react';

import type { LoginRequest } from '@/features/auth/auth.types';
import { useAuth } from '@/features/auth/use-auth';

/**
 * Does not navigate itself on success. Once login() resolves, AuthContext's
 * isAuthenticated flips to true and PublicRoute (wrapping /login) reacts by
 * redirecting to the originally requested route on its own — navigating
 * here too would race PublicRoute's redirect and could land on the wrong
 * destination depending on which one the router processes last.
 */
export function useLogin() {
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const submit = useCallback(
    async (payload: LoginRequest) => {
      setIsSubmitting(true);
      setError(null);

      try {
        await login(payload);
      } catch (caughtError) {
        setError(caughtError);
      } finally {
        setIsSubmitting(false);
      }
    },
    [login],
  );

  return { submit, isSubmitting, error };
}
