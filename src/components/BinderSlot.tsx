import type { Card } from '@/lib/schemas';
import { cn } from '@/lib/utils';
import { CardImage } from './CardImage';
import { FoilShimmer } from './FoilShimmer';

interface BinderSlotProps {
  card?: Card;
  owned: number;
  foilActive?: boolean;
  onClick?: () => void;
}

export function BinderSlot({ card, owned, foilActive, onClick }: BinderSlotProps) {
  const empty = !card;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative aspect-[5/7] rounded-md border text-left transition-transform',
        empty ? 'border-dashed border-border/50 bg-muted/20' : 'border-border hover:-translate-y-0.5',
      )}
    >
      {card ? (
        <FoilShimmer active={!!foilActive} className="h-full w-full">
          <CardImage
            src={card.image_small}
            alt={card.name}
            className={cn('h-full w-full', owned === 0 && 'grayscale opacity-40')}
          />
        </FoilShimmer>
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          —
        </span>
      )}
      {owned > 1 && (
        <span className="absolute right-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground shadow">
          ×{owned}
        </span>
      )}
      {card && (
        <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-[10px] text-white">
          {card.collector_number}
        </span>
      )}
    </button>
  );
}
