import { z } from 'zod';

export const loginSchema = z.object({
  login: z.string().trim().min(1, { message: 'auth.login.loginRequired' }),
  password: z.string().min(1, { message: 'auth.login.passwordRequired' }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Mirrors the backend's ChangePasswordDto validation for newPassword
 * exactly (src/modules/auth/dto/change-password.dto.ts): min 12 chars, max
 * 100, at least one uppercase, one lowercase, one digit and one special
 * character.
 */
const newPasswordSchema = z
  .string()
  .min(12, { message: 'auth.passwordRequirements.length' })
  .max(100)
  .regex(/[A-Z]/, { message: 'auth.passwordRequirements.uppercase' })
  .regex(/[a-z]/, { message: 'auth.passwordRequirements.lowercase' })
  .regex(/[0-9]/, { message: 'auth.passwordRequirements.number' })
  .regex(/[^A-Za-z0-9]/, { message: 'auth.passwordRequirements.special' });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: 'auth.login.passwordRequired' }),
    newPassword: newPasswordSchema,
    confirmPassword: z.string().min(1, { message: 'auth.login.passwordRequired' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'auth.passwordRequirements.match',
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
