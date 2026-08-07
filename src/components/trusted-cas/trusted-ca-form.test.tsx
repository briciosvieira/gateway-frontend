import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { CreateTrustedCaForm } from '@/components/trusted-cas/trusted-ca-form';
import i18next from '@/lib/i18n';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

function successBody<T>(data: T) {
  return {
    success: true,
    message: 'Request completed successfully.',
    data,
    requestId: 'req-1',
    timestamp: '2026-08-06T12:00:00.000Z',
  };
}

const sampleTrustedCa = {
  id: 'ca-1',
  name: 'Internal Root CA',
  fingerprintSha256: 'AA:BB:CC',
  subject: 'CN=Internal Root CA',
  issuer: 'CN=Internal Root CA',
  serialNumber: '01',
  validFrom: '2026-01-01T00:00:00.000Z',
  validTo: '2030-01-01T00:00:00.000Z',
  isRoot: true,
  active: true,
  createdById: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function selectFile(input: HTMLElement, file: File) {
  fireEvent.change(input, { target: { files: [file] } });
}

describe('CreateTrustedCaForm', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('requires a file before submitting', async () => {
    render(<CreateTrustedCaForm open onOpenChange={() => {}} onSuccess={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Internal Root CA' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Select a certificate file.')).toBeInTheDocument();
  });

  it('rejects a .key file client-side with a private-key-specific message', async () => {
    render(<CreateTrustedCaForm open onOpenChange={() => {}} onSuccess={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Internal Root CA' } });
    selectFile(
      screen.getByLabelText('File'),
      new File(['secret'], 'private.key', { type: 'application/x-pem-file' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(
      await screen.findByText('Private keys are not allowed. Upload only the public certificate.'),
    ).toBeInTheDocument();
  });

  it('rejects an unsupported extension client-side', async () => {
    render(<CreateTrustedCaForm open onOpenChange={() => {}} onSuccess={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Internal Root CA' } });
    selectFile(
      screen.getByLabelText('File'),
      new File(['data'], 'cert.txt', { type: 'text/plain' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(
      await screen.findByText('Unsupported file format. Use .pem, .crt or .cer.'),
    ).toBeInTheDocument();
  });

  it('uploads as a real multipart request and resets the form after success', async () => {
    // Note: this handler intentionally never awaits `request.formData()`/`.text()`.
    // Consuming the body of a fetch-adapter request built from a `FormData` holding
    // a real `File` hangs indefinitely under jsdom + MSW in this environment — a
    // test-environment limitation, not a product bug (multipart works normally in
    // real browsers). The exact field names (`name`, `file`) sent in that body are
    // already verified without touching the network in trusted-cas.service.test.ts;
    // this test instead confirms the request is genuinely multipart (not JSON/base64)
    // and that the dialog resets and reports success afterwards.
    let contentType: string | null = null;

    server.use(
      http.post(`${BASE}/trusted-cas`, ({ request }) => {
        contentType = request.headers.get('content-type');
        return HttpResponse.json(successBody(sampleTrustedCa));
      }),
    );

    const onSuccess = vi.fn();
    render(<CreateTrustedCaForm open onOpenChange={() => {}} onSuccess={onSuccess} />, {
      wrapper: createWrapper(),
    });

    const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Internal Root CA' } });
    const file = new File(['cert-bytes'], 'root-ca.pem', { type: 'application/x-pem-file' });
    selectFile(screen.getByLabelText('File'), file);
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledWith(sampleTrustedCa));

    expect(contentType).toMatch(/^multipart\/form-data/);
    // Reset after success: the name field goes back to empty rather than staying filled.
    expect(nameInput.value).toBe('');
  });
});
