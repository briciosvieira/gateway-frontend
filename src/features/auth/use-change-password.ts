import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { changePassword } from '@/features/auth/auth.service';
import type { ChangePasswordRequest } from '@/features/auth/auth.types';
import { useAuth } from '@/features/auth/use-auth';

const SUCCESS_REDIRECT_DELAY_MS = 1200;

export function useChangePassword() {
  const { reloadUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const submit = useCallback(
    async (payload: ChangePasswordRequest) => {
      setIsSubmitting(true);
      setError(null);

      try {
        await changePassword(payload);
        await reloadUser();
        setIsSuccess(true);
        setTimeout(() => navigate('/', { replace: true }), SUCCESS_REDIRECT_DELAY_MS);
      } catch (caughtError) {
        setError(caughtError);
      } finally {
        setIsSubmitting(false);
      }
    },
    [reloadUser, navigate],
  );

  return { submit, isSubmitting, isSuccess, error };
}
