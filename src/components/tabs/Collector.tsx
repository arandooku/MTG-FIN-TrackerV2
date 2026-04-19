import { useMemo } from 'react';
import { useAllCards } from '@/hooks/useCards';
import { useCollectionStore } from '@/store/collection';
import { classifyFoil, foilLabel } from '@/lib/foil';
import { CardImage } from '../CardImage';
import { FoilShimmer } from '../FoilShimmer';

export function Collector() {
  const { variants, isLoading } = useAllCards();
  const owned = useCollectionStore((s) => s.owned);
  const foil = useCollectionStore((s) => s.foil);

  const grouped = useMemo(() => {
    const byVariant = new Map<string, typeof variants>();
    for (const v of variants) {
      const key = classifyFoil(v);
      const list = byVariant.get(key) ?? [];
      list.push(v);
      byVariant.set(key, list);
    }
    return byVariant;
  }, [variants]);

  if (isLoading && !variants.length) {
    return <div className="py-12 text-center text-muted-foreground">Loading variants…</div>;
  }

  if (!variants.length) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No collector variants detected for this set.
      </div>
    );
  }

  const ownedSet = new Set(owned);

  return (
    <div className="space-y-6">
      {[...grouped.entries()].map(([variant, cards]) => (
        <section key={variant}>
          <h2 className="mb-2 font-[Cinzel] text-lg">
            {foilLabel(cards[0]!)}{' '}
            <span className="text-xs text-muted-foreground">({cards.length})</span>
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {cards.map((c) => {
              const isOwned = ownedSet.has(c.collector_number);
              const foilVariants = foil[c.collector_number] ?? [];
              return (
                <div key={c.collector_number} className="space-y-1">
                  <FoilShimmer active={isOwned}>
                    <CardImage
                      src={c.image_small}
                      alt={c.name}
                      className="aspect-[5/7]"
                    />
                  </FoilShimmer>
                  <div className="text-xs">
                    #{c.collector_number} {isOwned ? '✓' : ''}
                  </div>
                  {foilVariants.length > 0 && (
                    <div className="text-[10px] text-muted-foreground">
                      {foilVariants.join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
