import { describe, it, expect } from 'vitest';
import { isValidGistId } from '@/lib/gist';

describe('isValidGistId', () => {
  it('accepts 20–40 hex chars', () => {
    expect(isValidGistId('a'.repeat(20))).toBe(true);
    expect(isValidGistId('0123456789abcdef0123456789abcdef')).toBe(true);
    expect(isValidGistId('DEADBEEFDEADBEEFDEAD')).toBe(true);
  });

  it('rejects invalid', () => {
    expect(isValidGistId('short')).toBe(false);
    expect(isValidGistId('z'.repeat(32))).toBe(false);
    expect(isValidGistId('a'.repeat(50))).toBe(false);
  });
});
