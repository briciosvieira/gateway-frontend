import { describe, expect, it } from 'vitest';

import { ApiError, isApiError } from '@/lib/api/api-error';

describe('ApiError', () => {
  it('stores the provided fields', () => {
    const cause = new Error('original');
    const error = new ApiError('Something went wrong.', {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      requestId: 'req-123',
      cause,
    });

    expect(error.message).toBe('Something went wrong.');
    expect(error.name).toBe('ApiError');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.requestId).toBe('req-123');
    expect(error.cause).toBe(cause);
  });

  it('leaves optional fields undefined when not provided', () => {
    const error = new ApiError('Failed.', { statusCode: 500 });

    expect(error.code).toBeUndefined();
    expect(error.requestId).toBeUndefined();
    expect(error.details).toBeUndefined();
  });
});

describe('isApiError', () => {
  it('returns true for ApiError instances', () => {
    expect(isApiError(new ApiError('Failed.', { statusCode: 500 }))).toBe(true);
  });

  it('returns false for plain Error instances', () => {
    expect(isApiError(new Error('Failed.'))).toBe(false);
  });

  it('returns false for non-error values', () => {
    expect(isApiError('failed')).toBe(false);
    expect(isApiError(null)).toBe(false);
    expect(isApiError(undefined)).toBe(false);
  });
});
