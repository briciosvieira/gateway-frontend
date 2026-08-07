import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiKeyRevealDialog } from '@/components/api-keys/api-key-reveal-dialog';
import { env } from '@/config/env';
import i18next from '@/lib/i18n';

vi.mock('@/config/env', () => ({ env: { VITE_PUBLIC_GATEWAY_URL: undefined } }));

describe('ApiKeyRevealDialog', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  it('shows the plaintext key exactly once with the one-time warning', () => {
    render(<ApiKeyRevealDialog open apiKey="ghlf_a83f2d1c_secretvalue" onClose={() => {}} />);

    expect(screen.getByText('ghlf_a83f2d1c_secretvalue')).toBeInTheDocument();
    expect(screen.getByText('This key will only be shown once.')).toBeInTheDocument();
  });

  it('never renders the word "hash" or logs the key anywhere else', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    render(<ApiKeyRevealDialog open apiKey="ghlf_a83f2d1c_secretvalue" onClose={() => {}} />);

    expect(screen.queryByText(/hash/i)).not.toBeInTheDocument();
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('shows a fallback message when VITE_PUBLIC_GATEWAY_URL is not configured', () => {
    render(<ApiKeyRevealDialog open apiKey="ghlf_a83f2d1c_secretvalue" onClose={() => {}} />);

    expect(
      screen.getByText('Public endpoint not configured (VITE_PUBLIC_GATEWAY_URL missing).'),
    ).toBeInTheDocument();
  });

  it('copies the key to the clipboard when "Copy" is clicked', () => {
    render(<ApiKeyRevealDialog open apiKey="ghlf_a83f2d1c_secretvalue" onClose={() => {}} />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Copy' })[0]);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ghlf_a83f2d1c_secretvalue');
  });

  it('calls onClose when the confirm button is clicked', () => {
    const onClose = vi.fn();
    render(<ApiKeyRevealDialog open apiKey="ghlf_a83f2d1c_secretvalue" onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: "I've saved my API Key" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('ApiKeyRevealDialog with a configured public gateway URL', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
    env.VITE_PUBLIC_GATEWAY_URL = 'https://gatewayhub.example.com';
  });

  it('shows the public endpoint built from VITE_PUBLIC_GATEWAY_URL', () => {
    render(<ApiKeyRevealDialog open apiKey="ghlf_a83f2d1c_secretvalue" onClose={() => {}} />);

    expect(screen.getByText('https://gatewayhub.example.com/gateway')).toBeInTheDocument();
  });
});
