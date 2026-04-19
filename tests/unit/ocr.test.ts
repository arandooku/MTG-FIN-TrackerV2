import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractCollectorNumbers, getMonthKey } from '@/lib/ocr';

describe('extractCollectorNumbers', () => {
  it('pulls 1–4 digit tokens', () => {
    expect(extractCollectorNumbers('card 42 and 0123 and 5')).toEqual(['42', '0123', '5']);
  });

  it('returns empty when none', () => {
    expect(extractCollectorNumbers('no numbers here')).toEqual([]);
  });
});

describe('getMonthKey', () => {
  beforeEach(() => vi.useFakeTimers().setSystemTime(new Date('2026-04-05T00:00:00Z')));
  afterEach(() => vi.useRealTimers());

  it('zero-pads month', () => {
    expect(getMonthKey()).toBe('2026-04');
  });
});
