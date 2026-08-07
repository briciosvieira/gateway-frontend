import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';

import { PasswordRequirements } from '@/components/auth/password-requirements';
import i18next from '@/lib/i18n';

describe('PasswordRequirements', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('marks every requirement as unmet for an empty password', () => {
    render(<PasswordRequirements password="" />);

    expect(screen.getByText('At least 12 characters')).toHaveClass('text-muted');
    expect(screen.getByText('At least one uppercase letter')).toHaveClass('text-muted');
  });

  it('marks a requirement as met once the password satisfies it', () => {
    render(<PasswordRequirements password="Str0ng!Passw0rd" />);

    expect(screen.getByText('At least 12 characters')).toHaveClass('text-primary');
    expect(screen.getByText('At least one uppercase letter')).toHaveClass('text-primary');
    expect(screen.getByText('At least one lowercase letter')).toHaveClass('text-primary');
    expect(screen.getByText('At least one number')).toHaveClass('text-primary');
    expect(screen.getByText('At least one special character')).toHaveClass('text-primary');
  });

  it('only renders the match requirement when confirmPassword is provided', () => {
    const { rerender } = render(<PasswordRequirements password="abc" />);
    expect(screen.queryByText('Passwords must match')).not.toBeInTheDocument();

    rerender(<PasswordRequirements password="abc" confirmPassword="abc" />);
    expect(screen.getByText('Passwords must match')).toHaveClass('text-primary');
  });

  it('marks the match requirement as unmet when passwords differ', () => {
    render(<PasswordRequirements password="abc" confirmPassword="xyz" />);
    expect(screen.getByText('Passwords must match')).toHaveClass('text-muted');
  });
});
