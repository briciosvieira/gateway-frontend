import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { CopyField } from '@/components/shared/copy-field';
import i18next from '@/lib/i18n';

describe('CopyField', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  it('renders the value', () => {
    render(<CopyField value="Abc@12345678" />);
    expect(screen.getByText('Abc@12345678')).toBeInTheDocument();
  });

  it('copies the value to the clipboard and shows textual feedback', async () => {
    render(<CopyField value="Abc@12345678" />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Abc@12345678');
    expect(await screen.findByRole('button', { name: 'Copied!' })).toBeInTheDocument();
  });

  it('copies the full value even when visually truncated', () => {
    const longValue = 'https://gatewayhub.wdcpartners.com.br/gateway/a-very-long-route-slug-name';
    render(<CopyField value={longValue} truncate />);

    expect(screen.getByText(longValue)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(longValue);
  });
});
