import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { BinderSlot } from '../BinderSlot';
import { CardModal } from '../modals/CardModal';
import { useAllCards } from '@/hooks/useCards';
import { useCollectionStore } from '@/store/collection';
import { useConfigStore } from '@/store/config';
import { sortByCollector } from '@/lib/binder';
import { classifyFoil } from '@/lib/foil';
import type { Card as CardT } from '@/lib/schemas';

export function Binder() {
  const { main, isLoading } = useAllCards();
  const owned = useCollectionStore((s) => s.owned);
  const binder = useConfigStore((s) => s.binder);
  const [page, setPage] = useState(1);
  const [active, setActive] = useState<CardT | null>(null);

  const sorted = useMemo(() => sortByCollector(main), [main]);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const cn of owned) m.set(cn, (m.get(cn) ?? 0) + 1);
    return m;
  }, [owned]);

  const { slotsPerPage, gridCols } = binder;
  const totalPages = Math.max(1, Math.ceil(sorted.length / slotsPerPage));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * slotsPerPage;
  const slice = sorted.slice(start, start + slotsPerPage);

  if (isLoading && !sorted.length) {
    return <div className="py-12 text-center text-muted-foreground">Loading binder…</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={current <= 1}
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {current} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={current >= totalPages}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
      >
        {slice.map((card) => {
          const count = counts.get(card.collector_number) ?? 0;
          const variant = classifyFoil(card);
          return (
            <BinderSlot
              key={card.collector_number}
              card={card}
              owned={count}
              foilActive={count > 0 && variant !== 'none'}
              onClick={() => setActive(card)}
            />
          );
        })}
        {Array.from({ length: Math.max(0, slotsPerPage - slice.length) }).map((_, i) => (
          <BinderSlot key={`empty-${i}`} owned={0} />
        ))}
      </div>
      <CardModal card={active} onClose={() => setActive(null)} />
    </div>
  );
}
