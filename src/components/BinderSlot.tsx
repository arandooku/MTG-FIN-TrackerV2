import type { Card } from '@/lib/schemas';
import { cn } from '@/lib/utils';
import { CardImage } from './CardImage';
import { classifyFoil, foilSlotClass } from '@/lib/foil';

interface BinderSlotProps {
  card?: Card;
  owned: number;
  foilActive?: boolean;
  onClick?: () => void;
  showNumberedEmpty?: boolean;
}

export function BinderSlot({ card, owned, foilActive, onClick, showNumberedEmpty }: BinderSlotProps) {
  const empty = !card;
  const variant = card ? classifyFoil(card) : 'none';
  const showFoil = !!foilActive && variant !== 'none';
  const missing = !empty && owned === 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative aspect-[5/7] rounded-md text-left transition-transform overflow-hidden',
        empty
          ? 'border border-dashed border-[var(--ff-border)] bg-[var(--slot-bg)]'
          : 'border border-[var(--ff-border)] hover:-translate-y-0.5 hover:shadow-[0_4px_18px_var(--shadow)]',
        owned > 0 && !empty && 'border-[var(--owned-border)]',
      )}
      style={
        showFoil
          ? variant === 'collector-foil'
            ? { boxShadow: '0 0 14px rgba(200,220,255,0.35)' }
            : variant === 'surge-foil'
              ? { boxShadow: '0 0 14px rgba(91,127,199,0.45)' }
              : { boxShadow: '0 0 12px var(--ff-glow)' }
          : undefined
      }
    >
      {card ? (
        missing && showNumberedEmpty ? (
          <div className="absolute inset-0 slot-empty-numbered bg-[var(--slot-bg)]">
            <span className="n">#{card.collector_number}</span>
            <span className="name">{card.name}</span>
            <span className="plus">+</span>
          </div>
        ) : (
          <>
            <CardImage
              src={card.image_small}
              alt={card.name}
              className={cn('h-full w-full', owned === 0 && 'grayscale opacity-40')}
            />
            {showFoil && <div className={`foil-overlay ${foilSlotClass(card)}`} />}
          </>
        )
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-xs text-[var(--text-muted)]">
          —
        </span>
      )}
      {owned > 1 && (
        <span className="absolute right-1 top-1 rounded bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-bold text-white shadow font-num z-10">
          ×{owned}
        </span>
      )}
      {card && !(missing && showNumberedEmpty) && (
        <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-[10px] text-white font-num z-10">
          {card.collector_number}
        </span>
      )}
    </button>
  );
}
