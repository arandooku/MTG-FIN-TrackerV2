import type { Card } from './schemas';

const BASE = 'https://api.scryfall.com';
const THROTTLE_MS = 100;
let lastRequest = 0;

async function throttle() {
  const elapsed = Date.now() - lastRequest;
  if (elapsed < THROTTLE_MS) {
    await new Promise((r) => setTimeout(r, THROTTLE_MS - elapsed));
  }
  lastRequest = Date.now();
}

interface ScryfallCard {
  collector_number: string;
  name: string;
  rarity: string;
  type_line?: string;
  mana_cost?: string;
  image_uris?: { small: string; normal: string };
  card_faces?: Array<{ image_uris?: { small: string; normal: string } }>;
  prices?: { usd?: string | null; usd_foil?: string | null };
  scryfall_uri?: string;
  finishes?: string[];
  oracle_id?: string;
  frame_effects?: string[];
  promo_types?: string[];
}

interface ScryfallResponse {
  data: ScryfallCard[];
  has_more: boolean;
  next_page?: string;
}

function mapCard(c: ScryfallCard): Card {
  const finishes = c.finishes ?? ['nonfoil', 'foil'];
  return {
    collector_number: c.collector_number,
    name: c.name,
    rarity: c.rarity,
    type_line: c.type_line ?? '',
    mana_cost: c.mana_cost ?? '',
    image_small: c.image_uris?.small ?? c.card_faces?.[0]?.image_uris?.small ?? '',
    image_normal: c.image_uris?.normal ?? c.card_faces?.[0]?.image_uris?.normal ?? '',
    image_back_small: c.card_faces?.[1]?.image_uris?.small ?? '',
    image_back_normal: c.card_faces?.[1]?.image_uris?.normal ?? '',
    price_usd: Number.parseFloat(c.prices?.usd ?? '0') || 0,
    price_usd_foil: Number.parseFloat(c.prices?.usd_foil ?? '0') || 0,
    scryfall_uri: c.scryfall_uri ?? '',
    finishes,
    oracle_id: c.oracle_id ?? '',
    foil_only: Array.isArray(finishes) && finishes.every((f) => f !== 'nonfoil'),
    frame_effects: c.frame_effects ?? [],
    promo_types: c.promo_types ?? [],
  };
}

async function fetchAllPages(query: string): Promise<Card[]> {
  const out: Card[] = [];
  let url: string | undefined = `${BASE}/cards/search?${query}`;
  while (url) {
    await throttle();
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Scryfall ${resp.status}`);
    const data = (await resp.json()) as ScryfallResponse;
    for (const c of data.data) out.push(mapCard(c));
    url = data.has_more ? data.next_page : undefined;
  }
  return out;
}

export async function fetchMainSet(): Promise<Card[]> {
  const q =
    'q=' +
    encodeURIComponent('set:fin is:booster game:paper lang:en') +
    '&unique=prints&order=collector_number';
  return fetchAllPages(q);
}

export async function fetchVariants(): Promise<Card[]> {
  const q =
    'q=' +
    encodeURIComponent('set:fin -is:booster lang:en') +
    '&unique=prints&order=collector_number';
  try {
    return await fetchAllPages(q);
  } catch {
    return [];
  }
}

export function collectorKey(cn: string): [number, string] {
  const m = cn.match(/^(\d+)([a-z]?)$/i);
  if (!m) return [Number.POSITIVE_INFINITY, cn];
  return [Number.parseInt(m[1] ?? '0', 10), (m[2] ?? '').toLowerCase()];
}

export function compareCollector(a: string, b: string): number {
  const [an, as] = collectorKey(a);
  const [bn, bs] = collectorKey(b);
  if (an !== bn) return an - bn;
  return as.localeCompare(bs);
}
