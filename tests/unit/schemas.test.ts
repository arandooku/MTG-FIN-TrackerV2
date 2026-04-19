import { describe, it, expect } from 'vitest';
import { Card, CollectorNumber, SyncPayload, safeParse } from '@/lib/schemas';

describe('CollectorNumber', () => {
  it.each(['1', '042', '123a', '9999'])('accepts %s', (cn) => {
    expect(CollectorNumber.safeParse(cn).success).toBe(true);
  });

  it.each(['', '12345', 'abc', '12-3'])('rejects %s', (cn) => {
    expect(CollectorNumber.safeParse(cn).success).toBe(false);
  });
});

describe('Card schema defaults', () => {
  it('fills optional fields with defaults', () => {
    const parsed = Card.parse({
      collector_number: '001',
      name: 'Test',
      rarity: 'common',
    });

    expect(parsed.price_usd).toBe(0);
    expect(parsed.finishes).toEqual(['nonfoil', 'foil']);
    expect(parsed.frame_effects).toEqual([]);
    expect(parsed.foil_only).toBe(false);
  });
});

describe('SyncPayload', () => {
  it('allows partial payloads', () => {
    const parsed = SyncPayload.parse({ collection: { owned: ['1', '2'] } });
    expect(parsed.collection?.owned).toHaveLength(2);
    expect(parsed.packs).toBeUndefined();
  });
});

describe('safeParse', () => {
  it('returns null on invalid input', () => {
    expect(safeParse(CollectorNumber, 'not-a-cn')).toBeNull();
  });

  it('returns parsed value on valid input', () => {
    expect(safeParse(CollectorNumber, '042')).toBe('042');
  });
});
