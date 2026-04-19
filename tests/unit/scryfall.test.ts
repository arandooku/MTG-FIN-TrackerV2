import { describe, it, expect } from 'vitest';
import { collectorKey, compareCollector } from '@/lib/scryfall';

describe('collectorKey', () => {
  it('splits numeric and alpha suffix', () => {
    expect(collectorKey('42')).toEqual([42, '']);
    expect(collectorKey('42a')).toEqual([42, 'a']);
    expect(collectorKey('042B')).toEqual([42, 'b']);
  });

  it('returns sentinel for malformed input', () => {
    const [n, s] = collectorKey('nope');
    expect(n).toBe(Number.POSITIVE_INFINITY);
    expect(s).toBe('nope');
  });
});

describe('compareCollector', () => {
  it('sorts numerically first, then alpha suffix', () => {
    const arr = ['10', '2', '1b', '1', '1a'].sort(compareCollector);
    expect(arr).toEqual(['1', '1a', '1b', '2', '10']);
  });
});
