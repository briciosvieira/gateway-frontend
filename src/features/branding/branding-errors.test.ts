import { beforeAll, describe, expect, it } from 'vitest';

import { getBrandingUploadErrorMessage } from '@/features/branding/branding-errors';
import { ApiError } from '@/lib/api/api-error';
import i18next from '@/lib/i18n';

describe('getBrandingUploadErrorMessage', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('returns the fallback for a non-ApiError value', () => {
    expect(getBrandingUploadErrorMessage(new Error('boom'), 'fallback')).toBe('fallback');
  });

  it('maps 413 to the file-too-large message', () => {
    const error = new ApiError('Payload too large', { statusCode: 413 });
    expect(getBrandingUploadErrorMessage(error, 'fallback')).toBe('File too large.');
  });

  it('maps 415 to the unsupported-format message', () => {
    const error = new ApiError('Unsupported media type', { statusCode: 415 });
    expect(getBrandingUploadErrorMessage(error, 'fallback')).toBe('Unsupported format.');
  });

  it('maps 400 to the invalid-file message', () => {
    const error = new ApiError('Bad request', { statusCode: 400 });
    expect(getBrandingUploadErrorMessage(error, 'fallback')).toBe('Invalid file.');
  });

  it('falls back to the shared api.errors mapping for other statuses (e.g. 403)', () => {
    const error = new ApiError('Forbidden', { statusCode: 403 });
    expect(getBrandingUploadErrorMessage(error, 'fallback')).toBe(
      'You do not have permission to access this resource.',
    );
  });
});
