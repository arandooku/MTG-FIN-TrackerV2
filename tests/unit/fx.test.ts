import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchUSDtoMYR } from '@/lib/fx';

afterEach(() => vi.restoreAllMocks());

describe('fetchUSDtoMYR', () => {
  it('returns MYR rate on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: 'success', rates: { MYR: 4.72 } }),
    }));
    expect(await fetchUSDtoMYR()).toBe(4.72);
  });

  it('returns null on http error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
    expect(await fetchUSDtoMYR()).toBeNull();
  });

  it('returns null when rate missing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: 'success', rates: {} }),
    }));
    expect(await fetchUSDtoMYR()).toBeNull();
  });

  it('returns null when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net')));
    expect(await fetchUSDtoMYR()).toBeNull();
  });
});
