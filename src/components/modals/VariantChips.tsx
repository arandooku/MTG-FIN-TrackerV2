import type { ReactElement } from 'react';
import type { Card as CardT } from '@/lib/schemas';
import { getCardVariantInfo, vdotKind, vdotFoilKind, type VdotKind } from '@/lib/foil';

interface VariantChipsProps {
  card: CardT;
  mainCard: CardT | null;
  variantCards: CardT[];
  foilPreviewActive: boolean;
  foilOwned: Record<string, string[]>;
  owned: string[];
  onSelect: (v: CardT, foilPreview: boolean) => void;
}

const LEGEND_LABELS: Record<VdotKind, string> = {
  regular: 'Regular',
  foil: 'Foil',
  ext: 'Extended Art',
  'ext-foil': 'Ext Foil',
  showcase: 'Showcase',
  'showcase-foil': 'Showcase Foil',
  surge: 'Surge Foil',
  chocobo: 'Chocobo Track',
  collector: 'Collector',
  'collector-foil': 'Collector Foil',
};

const LEGEND_ORDER: VdotKind[] = [
  'regular',
  'foil',
  'ext',
  'ext-foil',
  'showcase',
  'showcase-foil',
  'surge',
  'chocobo',
  'collector',
  'collector-foil',
];

export function VariantChips({
  card,
  mainCard,
  variantCards,
  foilPreviewActive,
  foilOwned,
  owned,
  onSelect,
}: VariantChipsProps) {
  const cn = card.collector_number;
  const hasRegularOwned = (c: CardT) => owned.includes(c.collector_number);
  const hasFoilOwned = (c: CardT) => (foilOwned[c.collector_number] ?? []).length > 0;

  const legendSeen = new Set<VdotKind>();
  legendSeen.add('regular');
  const addLegend = (c: CardT) => {
    const hasNonfoil = c.finishes.includes('nonfoil');
    const hasFoil = c.finishes.includes('foil');
    if (hasNonfoil) legendSeen.add(vdotKind(c));
    if (hasFoil) legendSeen.add(vdotFoilKind(c));
  };
  if (mainCard) addLegend(mainCard);
  variantCards.forEach(addLegend);

  const rows: ReactElement[] = [];

  if (mainCard) {
    const mOwned = hasRegularOwned(mainCard);
    const mFoilOwned = hasFoilOwned(mainCard);
    const isActive = cn === mainCard.collector_number && !foilPreviewActive;
    const isFoilActive = cn === mainCard.collector_number && foilPreviewActive;
    const hasFoil = mainCard.finishes.includes('foil');
    rows.push(
      <div key={`main-${mainCard.collector_number}`} className="foil-row">
        <button
          type="button"
          className={`foil-chip ${isActive ? 'active' : ''} ${mOwned ? 'owned' : ''}`}
          onClick={() => onSelect(mainCard, false)}
          title={`#${mainCard.collector_number} Regular`}
        >
          <span className="vdot vdot-regular" />
          <span className="foil-chip-label">Regular</span>
          {mOwned && <span className="foil-chip-check">✓</span>}
        </button>
        {hasFoil && (
          <button
            type="button"
            className={`foil-chip ${isFoilActive ? 'active' : ''} ${mFoilOwned ? 'owned' : ''}`}
            onClick={() => onSelect(mainCard, true)}
            title={`#${mainCard.collector_number} Foil`}
          >
            <span className="vdot vdot-foil" />
            <span className="foil-chip-label">Foil</span>
            {mFoilOwned && <span className="foil-chip-check">✓</span>}
          </button>
        )}
      </div>,
    );
  }

  variantCards.forEach((v) => {
    const info = getCardVariantInfo(v);
    const baseLabel = info.label ? info.short : 'Variant';
    const label = `${baseLabel} #${v.collector_number}`;
    const vHasNonfoil = v.finishes.includes('nonfoil');
    const vHasFoil = v.finishes.includes('foil');
    const isFoilOnly = !vHasNonfoil && vHasFoil;
    const isActive = cn === v.collector_number && !foilPreviewActive;
    const isFoilActive = cn === v.collector_number && foilPreviewActive;

    if (isFoilOnly) {
      const vOwned = hasFoilOwned(v);
      rows.push(
        <div key={`v-${v.collector_number}`} className="foil-row">
          <button
            type="button"
            className={`foil-chip ${isActive || isFoilActive ? 'active' : ''} ${vOwned ? 'owned' : ''}`}
            onClick={() => onSelect(v, false)}
            title={`#${v.collector_number} ${info.label}`}
          >
            <span className={`vdot vdot-${vdotKind(v)}`} />
            <span className="foil-chip-label">{label}</span>
            {vOwned && <span className="foil-chip-check">✓</span>}
          </button>
        </div>,
      );
    } else {
      const rOwned = hasRegularOwned(v);
      const fOwned = hasFoilOwned(v);
      rows.push(
        <div key={`v-${v.collector_number}`} className="foil-row">
          <button
            type="button"
            className={`foil-chip ${isActive ? 'active' : ''} ${rOwned ? 'owned' : ''}`}
            onClick={() => onSelect(v, false)}
            title={`#${v.collector_number} ${info.label}`}
          >
            <span className={`vdot vdot-${vdotKind(v)}`} />
            <span className="foil-chip-label">{label}</span>
            {rOwned && <span className="foil-chip-check">✓</span>}
          </button>
          {vHasFoil && (
            <button
              type="button"
              className={`foil-chip ${isFoilActive ? 'active' : ''} ${fOwned ? 'owned' : ''}`}
              onClick={() => onSelect(v, true)}
              title={`#${v.collector_number} ${info.label} Foil`}
            >
              <span className={`vdot vdot-${vdotFoilKind(v)}`} />
              <span className="foil-chip-label">{label}</span>
              {fOwned && <span className="foil-chip-check">✓</span>}
            </button>
          )}
        </div>,
      );
    }
  });

  return (
    <div className="foil-rows">
      {rows}
      <div className="foil-legend">
        {LEGEND_ORDER.filter((k) => legendSeen.has(k)).map((k) => (
          <span key={k} className="foil-legend-item">
            <span className={`vdot vdot-${k}`} />
            {LEGEND_LABELS[k]}
          </span>
        ))}
      </div>
    </div>
  );
}
