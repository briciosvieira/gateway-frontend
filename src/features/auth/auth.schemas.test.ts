import { describe, expect, it } from 'vitest';

import { changePasswordSchema, loginSchema } from '@/features/auth/auth.schemas';

describe('loginSchema', () => {
  it('accepts a valid payload', () => {
    const result = loginSchema.safeParse({ login: 'ada', password: 'secret' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty login', () => {
    const result = loginSchema.safeParse({ login: '  ', password: 'secret' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty password', () => {
    const result = loginSchema.safeParse({ login: 'ada', password: '' });
    expect(result.success).toBe(false);
  });

  it('trims the login value', () => {
    const result = loginSchema.safeParse({ login: '  ada  ', password: 'secret' });
    expect(result.success && result.data.login).toBe('ada');
  });
});

describe('changePasswordSchema', () => {
  const validPassword = 'Str0ng!Passw0rd';

  it('accepts a payload meeting the backend password policy', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'old-password',
      newPassword: validPassword,
      confirmPassword: validPassword,
    });

    expect(result.success).toBe(true);
  });

  it('rejects a new password shorter than 12 characters', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'old-password',
      newPassword: 'Short1!',
      confirmPassword: 'Short1!',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a new password missing an uppercase letter', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'old-password',
      newPassword: 'str0ng!password',
      confirmPassword: 'str0ng!password',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a new password missing a special character', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'old-password',
      newPassword: 'Str0ngPassword',
      confirmPassword: 'Str0ngPassword',
    });

    expect(result.success).toBe(false);
  });

  it('rejects when confirmPassword does not match newPassword', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'old-password',
      newPassword: validPassword,
      confirmPassword: 'Different1!Password',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['confirmPassword']);
    }
  });
});
