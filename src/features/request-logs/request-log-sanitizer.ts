import { MASKED_REQUEST_LOG_VALUE } from '@/features/request-logs/request-logs.constants';
import type { JsonValue } from '@/features/request-logs/request-logs.types';

const SENSITIVE_REQUEST_LOG_KEYS = new Set([
  'authorization',
  'cookie',
  'xapikey',
  'password',
  'passwordhash',
  'accesstoken',
  'refreshtoken',
  'apikey',
  'apikeyhash',
  'keyhash',
  'secret',
  'valueencrypted',
  'certificatepem',
  'privatekey',
]);

function normalizeRequestLogKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isSensitiveRequestLogKey(key: string): boolean {
  const normalizedKey = normalizeRequestLogKey(key);

  return (
    normalizedKey.includes('password') ||
    normalizedKey.includes('token') ||
    SENSITIVE_REQUEST_LOG_KEYS.has(normalizedKey)
  );
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeUnknownValue(value: unknown, key?: string): JsonValue {
  if (key && isSensitiveRequestLogKey(key)) {
    return MASKED_REQUEST_LOG_VALUE;
  }

  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeUnknownValue(item));
  }

  if (isJsonObject(value)) {
    return Object.entries(value).reduce<Record<string, JsonValue>>(
      (accumulator, [entryKey, entryValue]) => {
        accumulator[entryKey] = sanitizeUnknownValue(entryValue, entryKey);
        return accumulator;
      },
      {},
    );
  }

  return String(value);
}

export function sanitizeRequestLogJson(value: unknown): JsonValue | null {
  if (value === null || value === undefined) {
    return null;
  }

  return sanitizeUnknownValue(value);
}

export function formatRequestLogJson(value: unknown): string {
  return JSON.stringify(sanitizeRequestLogJson(value), null, 2);
}
