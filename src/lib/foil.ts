import type { Card } from './schemas';

export type FoilVariant =
  | 'regular-foil'
  | 'surge-foil'
  | 'chocobo-track'
  | 'extended-art'
  | 'showcase'
  | 'collector-foil'
  | 'none';

export function isSurgeFoil(card: Card) {
  return card.promo_types.includes('surgefoil');
}

export function isChocoboTrack(card: Card) {
  return card.promo_types.includes('chocobotrackfoil');
}

export function isShowcase(card: Card) {
  return card.frame_effects.includes('inverted');
}

export function isExtendedArt(card: Card) {
  return card.frame_effects.includes('extendedart');
}

export function canBeFoil(card: Card) {
  return card.finishes.includes('foil');
}

export function classifyFoil(card: Card): FoilVariant {
  if (isSurgeFoil(card)) return 'surge-foil';
  if (isChocoboTrack(card)) return 'chocobo-track';
  if (isExtendedArt(card)) return 'extended-art';
  if (isShowcase(card)) return 'showcase';
  if (Number.parseInt(card.collector_number, 10) > 309) return 'collector-foil';
  if (canBeFoil(card)) return 'regular-foil';
  return 'none';
}

export const foilLabelMap: Record<FoilVariant, string> = {
  'surge-foil': 'Surge Foil',
  'chocobo-track': 'Chocobo Track',
  'extended-art': 'Extended Art',
  showcase: 'Showcase',
  'collector-foil': 'Collector Foil',
  'regular-foil': 'Foil',
  none: '—',
};

export function foilLabel(card: Card) {
  return foilLabelMap[classifyFoil(card)];
}

export function foilSlotClass(card: Card): string {
  const v = classifyFoil(card);
  if (v === 'none') return '';
  return `foil-variant-${v}`;
}

export interface VariantInfo {
  label: string;
  short: string;
}

export function getCardVariantInfo(card: Card): VariantInfo {
  if (isSurgeFoil(card)) return { label: 'Surge Foil', short: 'Surge' };
  if (isChocoboTrack(card)) return { label: 'Chocobo Track Foil', short: 'Chocobo' };
  if (isExtendedArt(card)) return { label: 'Extended Art', short: 'Ext' };
  if (isShowcase(card)) return { label: 'Showcase', short: 'Show' };
  return { label: '', short: 'Main' };
}
