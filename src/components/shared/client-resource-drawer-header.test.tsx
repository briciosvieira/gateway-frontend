import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';

import { ClientResourceDrawerHeader } from '@/components/shared/client-resource-drawer-header';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import i18next from '@/lib/i18n';

// `SheetTitle`/`SheetDescription` are Radix Dialog primitives that require a
// `Sheet` (Dialog.Root) + `SheetContent` (Dialog.Content) ancestor — exactly
// how the header is actually used in each `*ClientDrawer`.
function renderInSheet(ui: React.ReactNode) {
  return render(
    <Sheet open>
      <SheetContent side="right">{ui}</SheetContent>
    </Sheet>,
  );
}

describe('ClientResourceDrawerHeader', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('shows the title, client name, identifier and the client own status', () => {
    renderInSheet(
      <ClientResourceDrawerHeader
        title="API Keys — duda N8N"
        client={{ name: 'duda N8N', code: 'duda-n8n', active: true }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'API Keys — duda N8N' })).toBeInTheDocument();
    expect(screen.getByText('duda N8N')).toBeInTheDocument();
    expect(screen.getByText('duda-n8n')).toBeInTheDocument();
    expect(screen.getByText('Client status:')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows Inactive when the client itself is inactive', () => {
    renderInSheet(
      <ClientResourceDrawerHeader
        title="Allowed IPs — Acme"
        client={{ name: 'Acme', code: 'acme', active: false }}
      />,
    );

    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });
});
