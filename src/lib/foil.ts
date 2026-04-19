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

export type VdotKind =
  | 'regular'
  | 'foil'
  | 'ext'
  | 'ext-foil'
  | 'showcase'
  | 'showcase-foil'
  | 'surge'
  | 'chocobo'
  | 'collector'
  | 'collector-foil';

export function vdotKind(card: Card | null): VdotKind {
  if (!card) return 'regular';
  if (isSurgeFoil(card)) return 'surge';
  if (isChocoboTrack(card)) return 'chocobo';
  if (isExtendedArt(card)) return 'ext';
  if (isShowcase(card)) return 'showcase';
  if (Number.parseInt(card.collector_number, 10) > 309) return 'collector';
  return 'regular';
}

export function vdotFoilKind(card: Card | null): VdotKind {
  if (!card) return 'foil';
  if (isExtendedArt(card)) return 'ext-foil';
  if (isShowcase(card)) return 'showcase-foil';
  if (Number.parseInt(card.collector_number, 10) > 309) return 'collector-foil';
  return 'foil';
}

export function isInherentlyFoil(card: Card): boolean {
  return isSurgeFoil(card) || isChocoboTrack(card);
}
