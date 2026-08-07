import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { TrustedCasTable } from '@/components/trusted-cas/trusted-cas-table';
import type { TrustedCaListItem } from '@/features/trusted-cas/trusted-cas.types';
import i18next from '@/lib/i18n';

const ROW: TrustedCaListItem = {
  id: 'ca-1',
  name: 'Internal Root CA',
  fingerprintSha256:
    '24:3F:C0:52:8D:D6:3A:C2:9E:9F:ED:01:41:52:5B:F1:CA:D4:BA:03:DF:3C:8F:8F:88:13:FC:77:61:1F:F7:C7',
  subject: 'CN=Internal Root CA, O=WDC',
  issuer: 'CN=Internal Root CA, O=WDC',
  serialNumber: '01',
  validFrom: '2026-01-01T00:00:00.000Z',
  validTo: '2030-01-01T00:00:00.000Z',
  isRoot: true,
  active: true,
  createdById: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('TrustedCasTable', () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  beforeEach(() => {
    writeText.mockClear();
    Object.assign(navigator, {
      clipboard: {
        writeText,
      },
    });
  });

  it('renders only the real, confirmed metadata fields', () => {
    render(
      <TrustedCasTable
        rows={[ROW]}
        permissions={{ canChangeStatus: true, canDelete: true }}
        onToggleStatus={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('Internal Root CA')).toBeInTheDocument();
    expect(screen.getByText('Root CA')).toBeInTheDocument();
    expect(screen.getByText('24:3F:C0:52:8D...')).toBeInTheDocument();
    expect(screen.getAllByText('CN=Internal Root CA, O=WDC').length).toBeGreaterThan(0);
    expect(screen.getByText('Valid')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('keeps the full fingerprint value for copy while only abbreviating the table preview', async () => {
    render(
      <TrustedCasTable
        rows={[ROW]}
        permissions={{ canChangeStatus: true, canDelete: true }}
        onToggleStatus={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(ROW.fingerprintSha256));
    expect(screen.queryByText(ROW.fingerprintSha256)).not.toBeInTheDocument();
  });

  it('never renders a raw certificate/PEM value, even if it were present on the row', () => {
    const rowWithLeakedPem = {
      ...ROW,
      certificatePem: '-----BEGIN CERTIFICATE-----\nMIIB...',
    } as TrustedCaListItem & { certificatePem: string };

    render(
      <TrustedCasTable
        rows={[rowWithLeakedPem]}
        permissions={{ canChangeStatus: true, canDelete: true }}
        onToggleStatus={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.queryByText(/BEGIN CERTIFICATE/)).not.toBeInTheDocument();
  });

  it('hides Ativar/Desativar and Excluir when the caller lacks permission', () => {
    render(
      <TrustedCasTable
        rows={[ROW]}
        permissions={{ canChangeStatus: false, canDelete: false }}
        onToggleStatus={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));

    expect(screen.queryByText('Deactivate')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('never offers a download, raw-view, copy-PEM, export, or edit action', () => {
    render(
      <TrustedCasTable
        rows={[ROW]}
        permissions={{ canChangeStatus: true, canDelete: true }}
        onToggleStatus={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));

    for (const forbidden of [/download/i, /view certificate/i, /export/i, /edit/i, /copy pem/i]) {
      expect(screen.queryByText(forbidden)).not.toBeInTheDocument();
    }
  });
});
