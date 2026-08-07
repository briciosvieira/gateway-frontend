import { describe, expect, it } from 'vitest';

import { ApiError } from '@/lib/api/api-error';
import { getApiErrorMessage } from '@/lib/api/api-response';

describe('getApiErrorMessage', () => {
  it('returns the fallback when the error is not an ApiError', () => {
    expect(getApiErrorMessage(new Error('boom'), 'fallback message')).toBe('fallback message');
    expect(getApiErrorMessage('boom', 'fallback message')).toBe('fallback message');
  });

  it('maps NETWORK_ERROR to the network translation', () => {
    const error = new ApiError('Unable to connect to the server.', {
      statusCode: 0,
      code: 'NETWORK_ERROR',
    });

    expect(getApiErrorMessage(error, 'fallback')).toBe('Não foi possível conectar ao servidor.');
  });

  it('maps REQUEST_TIMEOUT to the timeout translation', () => {
    const error = new ApiError('The request took too long to complete.', {
      statusCode: 408,
      code: 'REQUEST_TIMEOUT',
    });

    expect(getApiErrorMessage(error, 'fallback')).toBe(
      'A requisição demorou demais para ser concluída.',
    );
  });

  it('maps known status codes to their translation', () => {
    expect(getApiErrorMessage(new ApiError('x', { statusCode: 401 }), 'fallback')).toBe(
      'Sua sessão não é válida ou expirou.',
    );
    expect(getApiErrorMessage(new ApiError('x', { statusCode: 404 }), 'fallback')).toBe(
      'O recurso solicitado não foi encontrado.',
    );
    expect(getApiErrorMessage(new ApiError('x', { statusCode: 429 }), 'fallback')).toBe(
      'Muitas requisições. Tente novamente em instantes.',
    );
  });

  it('falls back to the server translation for unmapped 5xx status codes', () => {
    const error = new ApiError('x', { statusCode: 503 });

    expect(getApiErrorMessage(error, 'fallback')).toBe(
      'Ocorreu um erro no servidor. Tente novamente mais tarde.',
    );
  });

  it('falls back to the unknown translation for unmapped 4xx status codes', () => {
    const error = new ApiError('x', { statusCode: 418 });

    expect(getApiErrorMessage(error, 'fallback')).toBe('Ocorreu um erro inesperado.');
  });
});
