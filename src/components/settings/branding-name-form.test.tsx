import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { BrandingNameForm } from '@/components/settings/branding-name-form';
import i18next from '@/lib/i18n';

describe('BrandingNameForm', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('loads the current applicationName into the input', () => {
    render(
      <BrandingNameForm
        applicationName="Gateway Hub LF"
        canEdit
        isSubmitting={false}
        error={null}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Application name')).toHaveValue('Gateway Hub LF');
  });

  it('disables the save button until the value changes (nothing to save yet)', () => {
    render(
      <BrandingNameForm
        applicationName="Gateway Hub LF"
        canEdit
        isSubmitting={false}
        error={null}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('calls onSubmit with the trimmed new name', async () => {
    const onSubmit = vi.fn();
    render(
      <BrandingNameForm
        applicationName="Gateway Hub LF"
        canEdit
        isSubmitting={false}
        error={null}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText('Application name'), {
      target: { value: '  Partner Gateway  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    // zodResolver validates asynchronously — the submit handler resolves on
    // a later microtask than the click event itself.
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('Partner Gateway'));
  });

  it('blocks submission and shows an error for a name shorter than 2 characters', async () => {
    const onSubmit = vi.fn();
    render(
      <BrandingNameForm
        applicationName="Gateway Hub LF"
        canEdit
        isSubmitting={false}
        error={null}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText('Application name'), { target: { value: 'A' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByText('The name must be between 2 and 100 characters.'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects a name containing angle brackets (no HTML allowed)', async () => {
    const onSubmit = vi.fn();
    render(
      <BrandingNameForm
        applicationName="Gateway Hub LF"
        canEdit
        isSubmitting={false}
        error={null}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText('Application name'), {
      target: { value: '<b>Gateway</b>' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByText('The name cannot contain the characters < or >.'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('hides the input and save button when canEdit is false', () => {
    render(
      <BrandingNameForm
        applicationName="Gateway Hub LF"
        canEdit={false}
        isSubmitting={false}
        error={null}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Application name')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  });
});
