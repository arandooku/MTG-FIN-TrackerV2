import { useMemo, useState } from 'react';
import { Input } from '../ui/input';
import { useAllCards } from '@/hooks/useCards';
import { useFx } from '@/hooks/useFx';
import { useCollectionStore } from '@/store/collection';
import { useConfigStore } from '@/store/config';
import { sortByCollector } from '@/lib/binder';
import { formatMYR, formatUSD } from '@/lib/utils';
import { CardImage } from '../CardImage';
import type { Card as CardT } from '@/lib/schemas';

export function Portfolio() {
  const { main, variants } = useAllCards();
  const owned = useCollectionStore((s) => s.owned);
  const currency = useConfigStore((s) => s.currency);
  const { data: rate = 4.7 } = useFx();
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const cn of owned) counts.set(cn, (counts.get(cn) ?? 0) + 1);
    const all = [...main, ...variants];
    const byCn = new Map<string, CardT>(all.map((c) => [c.collector_number, c] as const));
    const results: Array<{ card: CardT; count: number }> = [];
    for (const [cn, count] of counts) {
      const card = byCn.get(cn);
      if (card) results.push({ card, count });
    }
    const filtered = query
      ? results.filter(
          (r) =>
            r.card.name.toLowerCase().includes(query.toLowerCase()) ||
            r.card.collector_number.includes(query),
        )
      : results;
    return sortByCollector(filtered.map((r) => r.card)).map((card) => ({
      card,
      count: counts.get(card.collector_number) ?? 0,
    }));
  }, [main, variants, owned, query]);

  const fmt = currency === 'MYR' ? (n: number) => formatMYR(n * rate) : formatUSD;

  return (
    <div className="space-y-3">
      <Input
        placeholder="Filter by name or collector number…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {rows.map(({ card, count }) => (
          <div key={card.collector_number} className="space-y-1">
            <CardImage src={card.image_small} alt={card.name} className="aspect-[5/7]" />
            <div className="flex items-center justify-between text-xs">
              <span className="truncate">{card.name}</span>
              <span className="font-semibold">×{count}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              #{card.collector_number} · {fmt(card.price_usd)}
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="col-span-full py-10 text-center text-muted-foreground">
            No cards yet. Add some from the Binder tab.
          </div>
        )}
      </div>
    </div>
  );
}
