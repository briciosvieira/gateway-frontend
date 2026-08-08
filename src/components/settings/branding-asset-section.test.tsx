import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { BrandingAssetSection } from '@/components/settings/branding-asset-section';
import i18next from '@/lib/i18n';

const DEFAULT_PROPS = {
  title: 'Application logo',
  previewUrl: '/favicon.svg',
  previewAlt: 'Application logo',
  isCustom: false,
  accept: '.png,.jpg,.jpeg,.webp,.svg',
  maxSizeBytes: 2 * 1024 * 1024,
  formatsHint: 'Accepted formats: PNG, JPEG, WebP, SVG',
  variant: 'compact' as const,
  canEdit: true,
  canRemove: true,
  onUpload: vi.fn(),
  onRemove: vi.fn().mockResolvedValue(undefined),
  isUploading: false,
  isRemoving: false,
  removeConfirmTitle: 'Remove custom logo?',
  removeConfirmDescription: 'The application will go back to using the default logo.',
};

describe('BrandingAssetSection', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('shows the "using default" caption and no reset button when not customized', () => {
    render(<BrandingAssetSection {...DEFAULT_PROPS} />);

    expect(screen.getByText('Using the application default')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reset to default' })).not.toBeInTheDocument();
  });

  it('shows the formats hint and a reset button when customized', () => {
    render(
      <BrandingAssetSection
        {...DEFAULT_PROPS}
        isCustom
        previewUrl="https://cdn.example.com/logo.png"
      />,
    );

    expect(screen.getByText('Accepted formats: PNG, JPEG, WebP, SVG')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset to default' })).toBeInTheDocument();
  });

  it('hides every control when canEdit and canRemove are both false', () => {
    render(<BrandingAssetSection {...DEFAULT_PROPS} isCustom canEdit={false} canRemove={false} />);

    expect(screen.queryByLabelText('Replace')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reset to default' })).not.toBeInTheDocument();
  });

  it('shows the reset button but not the upload input when canEdit is false and canRemove is true', () => {
    render(<BrandingAssetSection {...DEFAULT_PROPS} isCustom canEdit={false} canRemove />);

    expect(screen.queryByLabelText('Replace')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset to default' })).toBeInTheDocument();
  });

  it('shows the upload input but not the reset button when canEdit is true and canRemove is false (operator: can replace, cannot delete)', () => {
    render(<BrandingAssetSection {...DEFAULT_PROPS} isCustom canEdit canRemove={false} />);

    expect(screen.getByLabelText('Replace')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reset to default' })).not.toBeInTheDocument();
  });

  it('calls onUpload with the selected file when its extension is accepted', () => {
    const onUpload = vi.fn();
    render(<BrandingAssetSection {...DEFAULT_PROPS} onUpload={onUpload} />);

    const file = new File(['bytes'], 'logo.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Replace'), { target: { files: [file] } });

    expect(onUpload).toHaveBeenCalledWith(file);
  });

  it('rejects an unsupported extension locally without calling onUpload', () => {
    const onUpload = vi.fn();
    render(<BrandingAssetSection {...DEFAULT_PROPS} onUpload={onUpload} />);

    const file = new File(['bytes'], 'logo.exe', { type: 'application/octet-stream' });
    fireEvent.change(screen.getByLabelText('Replace'), { target: { files: [file] } });

    expect(onUpload).not.toHaveBeenCalled();
    expect(screen.getByText('Unsupported format.')).toBeInTheDocument();
  });

  it('rejects a file larger than maxSizeBytes locally without calling onUpload', () => {
    const onUpload = vi.fn();
    render(<BrandingAssetSection {...DEFAULT_PROPS} maxSizeBytes={10} onUpload={onUpload} />);

    const file = new File(['this is more than ten bytes'], 'logo.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Replace'), { target: { files: [file] } });

    expect(onUpload).not.toHaveBeenCalled();
    expect(screen.getByText('File too large.')).toBeInTheDocument();
  });

  it('opens a confirmation dialog and calls onRemove only after confirming', async () => {
    const onRemove = vi.fn().mockResolvedValue(undefined);
    render(<BrandingAssetSection {...DEFAULT_PROPS} isCustom onRemove={onRemove} />);

    fireEvent.click(screen.getByRole('button', { name: 'Reset to default' }));
    expect(await screen.findByText('Remove custom logo?')).toBeInTheDocument();
    expect(onRemove).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('shows the upload/remove error messages when provided', () => {
    render(
      <BrandingAssetSection
        {...DEFAULT_PROPS}
        uploadErrorMessage="Invalid file."
        removeErrorMessage="Unable to update the image."
      />,
    );

    expect(screen.getByText('Invalid file.')).toBeInTheDocument();
  });
});
