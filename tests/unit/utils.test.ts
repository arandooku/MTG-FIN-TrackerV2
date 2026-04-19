import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cn,
  formatUSD,
  formatMYR,
  relativeTime,
  debounce,
  clamp,
  scryfallLarge,
  scryfallPng,
  MTG_CARD_BACK,
} from '@/lib/utils';

describe('cn', () => {
  it('merges classes and resolves tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('a', false && 'b', 'c')).toBe('a c');
  });
});

describe('formatUSD / formatMYR', () => {
  it('formats currency with symbol', () => {
    expect(formatUSD(12.5)).toContain('12.50');
    expect(formatUSD(12.5)).toContain('$');
    expect(formatMYR(3)).toContain('3.00');
  });
});

describe('clamp', () => {
  it('bounds within min/max', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
});

describe('scryfallLarge / scryfallPng', () => {
  it('rewrites size segment', () => {
    expect(scryfallLarge('https://x/cards/normal/a.jpg')).toBe('https://x/cards/large/a.jpg');
    expect(scryfallLarge('https://x/cards/small/a.jpg')).toBe('https://x/cards/large/a.jpg');
    expect(scryfallPng('https://x/cards/normal/a.jpg')).toBe('https://x/cards/png/a.png');
  });

  it('returns empty input untouched', () => {
    expect(scryfallLarge('')).toBe('');
    expect(scryfallPng('')).toBe('');
  });
});

describe('MTG_CARD_BACK', () => {
  it('is self-hosted (not third-party CDN)', () => {
    expect(MTG_CARD_BACK).toBe('/card-back.svg');
  });
});

describe('relativeTime', () => {
  beforeEach(() => vi.useFakeTimers().setSystemTime(new Date('2026-01-01T12:00:00Z')));
  afterEach(() => vi.useRealTimers());

  it('returns "just now" under a minute', () => {
    expect(relativeTime(new Date('2026-01-01T11:59:30Z'))).toBe('just now');
  });

  it('returns minutes, hours, days', () => {
    expect(relativeTime(new Date('2026-01-01T11:55:00Z'))).toBe('5m ago');
    expect(relativeTime(new Date('2026-01-01T09:00:00Z'))).toBe('3h ago');
    expect(relativeTime(new Date('2025-12-30T12:00:00Z'))).toBe('2d ago');
  });
});

describe('debounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('calls fn only once after rapid invocations', () => {
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d();
    d();
    d();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
