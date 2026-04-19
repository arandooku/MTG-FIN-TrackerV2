import type { BinderConfig, Card } from './schemas';
import { compareCollector } from './scryfall';

export function sortByCollector(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => compareCollector(a.collector_number, b.collector_number));
}

export function getPlacement(cards: Card[], card: Card, slotsPerPage: number) {
  const idx = cards.findIndex((c) => c.collector_number === card.collector_number);
  if (idx === -1) return { page: null, slot: null };
  return { page: Math.floor(idx / slotsPerPage) + 1, slot: (idx % slotsPerPage) + 1 };
}

export function calcPageCount(total: number, slotsPerPage: number) {
  return Math.max(1, Math.ceil(total / slotsPerPage));
}

export const BINDER_PRESETS: Array<{
  name: string;
  gridRows: number;
  gridCols: number;
  slotsPerPage: number;
}> = [
  { name: '4-pocket', gridRows: 2, gridCols: 2, slotsPerPage: 4 },
  { name: '9-pocket', gridRows: 3, gridCols: 3, slotsPerPage: 9 },
  { name: '12-pocket', gridRows: 3, gridCols: 4, slotsPerPage: 12 },
  { name: '16-pocket', gridRows: 4, gridCols: 4, slotsPerPage: 16 },
];

export function defaultBinderConfig(totalCards = 309): BinderConfig {
  return {
    gridRows: 3,
    gridCols: 3,
    slotsPerPage: 9,
    pageCount: calcPageCount(totalCards, 9),
    presetName: '9-pocket',
    scope: { mainSet: true, collectorBinder: false },
    configured: false,
  };
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev: number[] = new Array(b.length + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let curr = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const next = Math.min(curr + 1, (prev[j] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
      prev[j - 1] = curr;
      curr = next;
    }
    prev[b.length] = curr;
  }
  return prev[b.length] ?? 0;
}

export function fuzzyMatchName(query: string, cards: Card[], limit = 5): Card[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const scored = cards
    .map((c) => {
      const name = c.name.toLowerCase();
      if (name === q) return { c, score: 0 };
      if (name.includes(q)) return { c, score: 1 };
      return { c, score: 2 + levenshtein(q, name) / Math.max(q.length, name.length) };
    })
    .filter((s) => s.score < 3)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);
  return scored.map((s) => s.c);
}
