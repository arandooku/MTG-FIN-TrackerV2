import { describe, it, expect } from 'vitest';
import {
  classifyFoil,
  canBeFoil,
  foilLabel,
  foilSlotClass,
  isInherentlyFoil,
  getCardVariantInfo,
  vdotKind,
  vdotFoilKind,
} from '@/lib/foil';
import type { Card } from '@/lib/schemas';

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    collector_number: '001',
    name: 'Test',
    rarity: 'rare',
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
    ...overrides,
  };
}

describe('classifyFoil priority', () => {
  it('surge > chocobo > extended > showcase > collector > regular > none', () => {
    expect(classifyFoil(makeCard({ promo_types: ['surgefoil'] }))).toBe('surge-foil');
    expect(classifyFoil(makeCard({ promo_types: ['chocobotrackfoil'] }))).toBe('chocobo-track');
    expect(classifyFoil(makeCard({ frame_effects: ['extendedart'] }))).toBe('extended-art');
    expect(classifyFoil(makeCard({ frame_effects: ['inverted'] }))).toBe('showcase');
    expect(classifyFoil(makeCard({ collector_number: '400' }))).toBe('collector-foil');
    expect(classifyFoil(makeCard())).toBe('regular-foil');
    expect(classifyFoil(makeCard({ finishes: ['nonfoil'] }))).toBe('none');
  });
});

describe('canBeFoil', () => {
  it('respects finishes array', () => {
    expect(canBeFoil(makeCard())).toBe(true);
    expect(canBeFoil(makeCard({ finishes: ['nonfoil'] }))).toBe(false);
  });
});

describe('foilLabel / foilSlotClass', () => {
  it('labels match classification', () => {
    expect(foilLabel(makeCard({ promo_types: ['surgefoil'] }))).toBe('Surge Foil');
    expect(foilLabel(makeCard({ finishes: ['nonfoil'] }))).toBe('—');
  });

  it('slot class prefixed and blank for none', () => {
    expect(foilSlotClass(makeCard())).toBe('foil-variant-regular-foil');
    expect(foilSlotClass(makeCard({ finishes: ['nonfoil'] }))).toBe('');
  });
});

describe('vdot helpers', () => {
  it('null card returns baseline', () => {
    expect(vdotKind(null)).toBe('regular');
    expect(vdotFoilKind(null)).toBe('foil');
  });

  it('surge/chocobo/ext/showcase/collector mapping', () => {
    expect(vdotKind(makeCard({ promo_types: ['surgefoil'] }))).toBe('surge');
    expect(vdotKind(makeCard({ promo_types: ['chocobotrackfoil'] }))).toBe('chocobo');
    expect(vdotKind(makeCard({ frame_effects: ['extendedart'] }))).toBe('ext');
    expect(vdotKind(makeCard({ frame_effects: ['inverted'] }))).toBe('showcase');
    expect(vdotKind(makeCard({ collector_number: '400' }))).toBe('collector');

    expect(vdotFoilKind(makeCard({ frame_effects: ['extendedart'] }))).toBe('ext-foil');
    expect(vdotFoilKind(makeCard({ frame_effects: ['inverted'] }))).toBe('showcase-foil');
    expect(vdotFoilKind(makeCard({ collector_number: '400' }))).toBe('collector-foil');
  });
});

describe('isInherentlyFoil', () => {
  it('surge and chocobo are inherent', () => {
    expect(isInherentlyFoil(makeCard({ promo_types: ['surgefoil'] }))).toBe(true);
    expect(isInherentlyFoil(makeCard({ promo_types: ['chocobotrackfoil'] }))).toBe(true);
    expect(isInherentlyFoil(makeCard())).toBe(false);
  });
});

describe('getCardVariantInfo', () => {
  it('returns short label for known variants', () => {
    expect(getCardVariantInfo(makeCard({ promo_types: ['surgefoil'] })).short).toBe('Surge');
    expect(getCardVariantInfo(makeCard({ frame_effects: ['extendedart'] })).short).toBe('Ext');
    expect(getCardVariantInfo(makeCard()).short).toBe('Main');
  });
});
