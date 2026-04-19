import { useMemo, useState } from 'react';
import { useAllCards } from '@/hooks/useCards';
import { useCollectionStore } from '@/store/collection';
import { classifyFoil, foilLabel, foilSlotClass } from '@/lib/foil';
import { CardImage } from '../CardImage';
import { CardModal } from '../modals/CardModal';
import type { Card as CardT } from '@/lib/schemas';

export function Collector() {
  const { variants, isLoading } = useAllCards();
  const owned = useCollectionStore((s) => s.owned);
  const foil = useCollectionStore((s) => s.foil);
  const [active, setActive] = useState<CardT | null>(null);

  const grouped = useMemo(() => {
    const byVariant = new Map<string, CardT[]>();
    for (const v of variants) {
      const key = classifyFoil(v);
      const list = byVariant.get(key) ?? [];
      list.push(v);
      byVariant.set(key, list);
    }
    return byVariant;
  }, [variants]);

  if (isLoading && !variants.length) {
    return <div className="py-12 text-center text-[var(--text-muted)]">Loading variants…</div>;
  }
  if (!variants.length) {
    return (
      <div className="py-12 text-center text-[var(--text-muted)]">
        No collector variants detected for this set.
      </div>
    );
  }

  const ownedSet = new Set(owned);

  return (
    <div className="space-y-6">
      {[...grouped.entries()].map(([variant, cards]) => {
        const ownedCount = cards.filter((c) => ownedSet.has(c.collector_number)).length;
        return (
          <section key={variant} className="dash-card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base">{foilLabel(cards[0]!)}</h2>
              <span className="text-[0.65rem] uppercase tracking-widest text-[var(--text-muted)] font-num">
                {ownedCount} / {cards.length}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {cards.map((c) => {
                const isOwned = ownedSet.has(c.collector_number);
                const foilVariants = foil[c.collector_number] ?? [];
                const v = classifyFoil(c);
                return (
                  <button
                    key={c.collector_number}
                    type="button"
                    onClick={() => setActive(c)}
                    className="space-y-1 text-left transition-transform hover:-translate-y-0.5"
                  >
                    <div
                      className={`relative overflow-hidden rounded-md border ${
                        isOwned
                          ? 'border-[var(--owned-border)]'
                          : 'border-[var(--ff-border)]'
                      }`}
                    >
                      <CardImage
                        src={c.image_small}
                        alt={c.name}
                        className={`aspect-[5/7] ${!isOwned ? 'grayscale opacity-40' : ''}`}
                      />
                      {isOwned && v !== 'none' && (
                        <div className={`foil-overlay ${foilSlotClass(c)}`} />
                      )}
                      {isOwned && (
                        <span className="absolute right-1 top-1 rounded bg-[var(--owned-border)] px-1.5 py-0.5 text-[9px] font-bold text-white">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-num text-[var(--text-muted)]">
                      #{c.collector_number}
                    </div>
                    {foilVariants.length > 0 && (
                      <div className="text-[9px] text-[var(--foil-color)] font-ui">
                        {foilVariants.join(', ')}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
      <CardModal card={active} onClose={() => setActive(null)} onSwitchCard={setActive} />
    </div>
  );
}
