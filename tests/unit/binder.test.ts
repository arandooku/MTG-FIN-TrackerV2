import { describe, it, expect } from 'vitest';
import {
  sortByCollector,
  getPlacement,
  calcPageCount,
  defaultBinderConfig,
  levenshtein,
  fuzzyMatchName,
  BINDER_PRESETS,
} from '@/lib/binder';
import type { Card } from '@/lib/schemas';

function c(cn: string, name = `n${cn}`): Card {
  return {
    collector_number: cn,
    name,
    rarity: 'common',
    type_line: '',
    mana_cost: '',
    image_small: '',
    image_normal: '',
    image_back_small: '',
    image_back_normal: '',
    price_usd: 0,
    price_usd_foil: 0,
    scryfall_uri: '',
    finishes: ['nonfoil', 'foil'],
    oracle_id: '',
    foil_only: false,
    frame_effects: [],
    promo_types: [],
  };
}

describe('sortByCollector', () => {
  it('orders by numeric then alpha', () => {
    const arr = [c('10'), c('2'), c('1a'), c('1')].map((x) => x.collector_number);
    const sorted = sortByCollector([c('10'), c('2'), c('1a'), c('1')]).map((x) => x.collector_number);
    expect(sorted).toEqual(['1', '1a', '2', '10']);
    // original list untouched
    expect(arr).toEqual(['10', '2', '1a', '1']);
  });
});

describe('calcPageCount', () => {
  it('rounds up with floor of 1', () => {
    expect(calcPageCount(0, 9)).toBe(1);
    expect(calcPageCount(9, 9)).toBe(1);
    expect(calcPageCount(10, 9)).toBe(2);
  });
});

describe('getPlacement', () => {
  it('returns 1-based page and slot', () => {
    const cards = [c('1'), c('2'), c('3'), c('4'), c('5')];
    expect(getPlacement(cards, c('1'), 2)).toEqual({ page: 1, slot: 1 });
    expect(getPlacement(cards, c('3'), 2)).toEqual({ page: 2, slot: 1 });
    expect(getPlacement(cards, c('99'), 2)).toEqual({ page: null, slot: null });
  });
});

describe('defaultBinderConfig', () => {
  it('produces sane 9-pocket default', () => {
    const cfg = defaultBinderConfig(309);
    expect(cfg.slotsPerPage).toBe(9);
    expect(cfg.pageCount).toBe(calcPageCount(309, 9));
    expect(cfg.configured).toBe(false);
  });

  it('exposes known presets', () => {
    const names = BINDER_PRESETS.map((p) => p.name);
    expect(names).toContain('9-pocket');
    expect(BINDER_PRESETS.every((p) => p.slotsPerPage === p.gridRows * p.gridCols)).toBe(true);
  });
});

describe('levenshtein', () => {
  it('edit distance basics', () => {
    expect(levenshtein('', '')).toBe(0);
    expect(levenshtein('a', '')).toBe(1);
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('same', 'same')).toBe(0);
  });
});

describe('fuzzyMatchName', () => {
  const pool = [c('1', 'Cloud Strife'), c('2', 'Tifa'), c('3', 'Aerith'), c('4', 'Cloudy')];

  it('exact match ranks first', () => {
    const r = fuzzyMatchName('Cloud Strife', pool);
    expect(r[0]?.name).toBe('Cloud Strife');
  });

  it('substring beats fuzzy', () => {
    const r = fuzzyMatchName('cloud', pool);
    expect(r.slice(0, 2).map((x) => x.name)).toEqual(expect.arrayContaining(['Cloud Strife', 'Cloudy']));
  });

  it('empty query returns empty', () => {
    expect(fuzzyMatchName('', pool)).toEqual([]);
  });
});
