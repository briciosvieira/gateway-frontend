import { describe, expect, it } from 'vitest';

import { generateIdentifier } from '@/features/clients/utils/generate-identifier';

describe('generateIdentifier', () => {
  it('lowercases the value', () => {
    expect(generateIdentifier('ACME')).toBe('acme');
  });

  it('removes accents', () => {
    expect(generateIdentifier('São José')).toBe('sao-jose');
  });

  it('replaces spaces with hyphens', () => {
    expect(generateIdentifier('Acme Corp')).toBe('acme-corp');
  });

  it('removes special characters', () => {
    expect(generateIdentifier('ACME Comércio & Serviços')).toBe('acme-comercio-servicos');
  });

  it('collapses duplicate hyphens produced by removed characters', () => {
    expect(generateIdentifier('Cliente Nº 01')).toBe('cliente-n-01');
  });

  it('trims leading and trailing whitespace before slugifying', () => {
    expect(generateIdentifier('  Acme E7 Corp Renamed  ')).toBe('acme-e7-corp-renamed');
  });

  it('never leaves a leading or trailing hyphen', () => {
    expect(generateIdentifier('-Acme-')).toBe('acme');
    expect(generateIdentifier('  -- Acme -- ')).toBe('acme');
  });

  it('returns an empty string for an empty or whitespace-only input', () => {
    expect(generateIdentifier('')).toBe('');
    expect(generateIdentifier('   ')).toBe('');
  });

  it('keeps digits and hyphens already present', () => {
    expect(generateIdentifier('client-007')).toBe('client-007');
  });
});
