import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { TemporaryPasswordDialog } from '@/components/users/temporary-password-dialog';
import i18next from '@/lib/i18n';

describe('TemporaryPasswordDialog', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  it('shows the password and the one-time warning', () => {
    render(
      <TemporaryPasswordDialog
        open
        password="Abc@12345678"
        mustChangeOnNextLogin
        onClose={() => {}}
      />,
    );

    expect(screen.getByText('Abc@12345678')).toBeInTheDocument();
    expect(screen.getByText('This password will only be shown once.')).toBeInTheDocument();
  });

  it('indicates when the password change is mandatory on next login', () => {
    render(
      <TemporaryPasswordDialog
        open
        password="Abc@12345678"
        mustChangeOnNextLogin
        onClose={() => {}}
      />,
    );

    expect(
      screen.getByText('The user will have to change this password on first login.'),
    ).toBeInTheDocument();
  });

  it('indicates when the password change is not mandatory', () => {
    render(
      <TemporaryPasswordDialog
        open
        password="Abc@12345678"
        mustChangeOnNextLogin={false}
        onClose={() => {}}
      />,
    );

    expect(
      screen.getByText('Changing the password is not required on next login.'),
    ).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <TemporaryPasswordDialog
        open
        password="Abc@12345678"
        mustChangeOnNextLogin
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
