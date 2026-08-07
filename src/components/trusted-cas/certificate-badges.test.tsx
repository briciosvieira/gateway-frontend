import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';

import { CertificateTypeBadge } from '@/components/trusted-cas/certificate-type-badge';
import { CertificateValidityBadge } from '@/components/trusted-cas/certificate-validity-badge';
import i18next from '@/lib/i18n';

describe('CertificateTypeBadge', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('shows "Root CA" for self-signed roots', () => {
    render(<CertificateTypeBadge isRoot />);
    expect(screen.getByText('Root CA')).toBeInTheDocument();
  });

  it('shows "CA" — never "Intermediate CA" — for non-root certificates', () => {
    render(<CertificateTypeBadge isRoot={false} />);
    expect(screen.getByText('CA')).toBeInTheDocument();
    expect(screen.queryByText(/intermediate/i)).not.toBeInTheDocument();
  });
});

describe('CertificateValidityBadge', () => {
  it('shows Valid/Expiring/Expired purely from validTo, without touching active status', () => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const { unmount: unmountValid } = render(
      <CertificateValidityBadge validTo={new Date(now + 60 * day).toISOString()} />,
    );
    expect(screen.getByText('Valid')).toBeInTheDocument();
    unmountValid();

    const { unmount: unmountExpiring } = render(
      <CertificateValidityBadge validTo={new Date(now + 10 * day).toISOString()} />,
    );
    expect(screen.getByText('Expiring')).toBeInTheDocument();
    unmountExpiring();

    render(<CertificateValidityBadge validTo={new Date(now - day).toISOString()} />);
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });
});
