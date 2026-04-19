import type { Card } from '@/lib/schemas';
import { CardImage } from '../CardImage';
import { classifyFoil } from '@/lib/foil';
import { FoilOverlay } from '../FoilOverlay';
import { scryfallLarge } from '@/lib/utils';

interface CardThumbProps {
  card?: Card;
  empty?: boolean;
  qty?: number;
  foil?: boolean;
  onClick?: () => void;
}

function manaClass(card?: Card): string {
  if (!card) return 'mana-c';
  const cost = card.mana_cost?.toUpperCase() ?? '';
  const colors = ['W', 'U', 'B', 'R', 'G'].filter((c) => cost.includes(`{${c}}`));
  if (colors.length === 0) return 'mana-c';
  if (colors.length > 1) return 'mana-m';
  return `mana-${colors[0].toLowerCase()}`;
}

export function CardThumb({ card, empty, qty, foil, onClick }: CardThumbProps) {
  if (empty || !card) {
    return <div className="app-cardthumb empty" style={{ width: '100%' }} aria-hidden />;
  }
  const missing = qty !== undefined && qty <= 0 && !foil;
  if (missing) {
    const shortName = card.name.length > 14 ? `${card.name.slice(0, 14)}…` : card.name;
    return (
      <button
        type="button"
        className="app-cardthumb missing"
        style={{ width: '100%' }}
        onClick={onClick}
        aria-label={`${card.name} (missing)`}
      >
        <div className="app-sil">
          <span className="app-sil-num">#{card.collector_number}</span>
          <span className="app-sil-name">{shortName}</span>
          <span className="app-sil-add" aria-hidden>+</span>
        </div>
      </button>
    );
  }
  const variant = classifyFoil(card);
  const showOverlay = !!foil && variant !== 'none';
  return (
    <button
      type="button"
      className={`app-cardthumb owned group ${card.image_small ? '' : manaClass(card)}`}
      onClick={onClick}
      aria-label={card.name}
      style={{
        position: 'relative',
        width: '100%',
        background: 'rgba(13,22,40,0.55)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    >
      {card.image_small ? (
        <CardImage
          src={scryfallLarge(card.image_normal || card.image_small)}
          alt={card.name}
          className="h-full w-full"
        />
      ) : null}
      {showOverlay && <FoilOverlay card={card} />}
      {foil && <span className="app-foil-badge" aria-label="Foil">✦</span>}
      {qty && qty > 1 ? <span className="app-qty">×{qty}</span> : null}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        style={{
          borderRadius: 'inherit',
          boxShadow:
            'inset 0 0 0 2px var(--app-gold-bright), 0 0 14px rgba(240,207,110,0.45)',
        }}
      />
    </button>
  );
}
