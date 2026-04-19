import { useCallback } from 'react';
import type { Card } from '@/lib/schemas';
import { rarityConfig, spawnGlobalConfetti } from '@/lib/celebration';
import { getPlacement } from '@/lib/binder';
import { useAllCards } from '@/hooks/useCards';
import { useFx } from '@/hooks/useFx';
import { useCollectionStore } from '@/store/collection';
import { useConfigStore } from '@/store/config';
import { useToastStore, toast } from '@/store/toast';

const MILESTONES: readonly number[] = [10, 25, 50, 100, 150, 200, 250, 300];

const crossedMilestone = (before: number, after: number): number | null => {
  for (const m of MILESTONES) {
    if (before < m && after >= m) return m;
  }
  return null;
};

type RarityKey = 'common' | 'uncommon' | 'rare' | 'mythic';

const RARITY_MSGS: Record<RarityKey, string[]> = {
  common: ['Collected!', 'Got it!', 'Added!'],
  uncommon: ['Nice find!', 'Sparkly!', 'Got it!', 'Into the binder!'],
  rare: ['Rare pull!', "Now we're talking!", 'Golden!', 'Sweet pull!'],
  mythic: ['MYTHIC PULL!', 'LEGENDARY!', 'INCREDIBLE!', 'JACKPOT!'],
};

const RARITY_LABELS: Record<RarityKey, string> = {
  common: 'COMMON',
  uncommon: 'UNCOMMON',
  rare: 'RARE',
  mythic: 'MYTHIC RARE',
};

const FOIL_MSGS = [
  'Shimmer acquired.',
  'It catches the light.',
  'The foil is real.',
  'Prismatic.',
  "That one's a keeper.",
  'Foil secured. \u2726',
  'Ooh, shiny.',
];

const pickRarity = (r: string): RarityKey =>
  (['common', 'uncommon', 'rare', 'mythic'] as const).includes(r as RarityKey)
    ? (r as RarityKey)
    : 'common';

const randomOf = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)] as T;

export function useCelebrate() {
  const all = useAllCards();
  const fx = useFx();
  const slotsPerPage = useConfigStore((s) => s.binder.slotsPerPage);
  const currency = useConfigStore((s) => s.currency);
  const muteCel = useConfigStore((s) => s.muteCelebration);
  const pushCard = useToastStore((s) => s.pushCard);
  const owned = useCollectionStore((s) => s.owned);

  const formatPrice = useCallback(
    (usd: number, foilTag = false): string => {
      if (!usd) return '';
      const rate = fx.data ?? 4.7;
      const suffix = foilTag ? ' foil' : '';
      if (currency === 'MYR') return ` · RM ${(usd * rate).toFixed(2)}${suffix}`;
      return ` · $${usd.toFixed(2)}${suffix}`;
    },
    [fx.data, currency],
  );

  const placementFor = useCallback(
    (card: Card): { page: number | null; slot: number | null; isVariant: boolean } => {
      const main = all.main.find((c) => c.collector_number === card.collector_number);
      if (main) {
        const p = getPlacement(all.main, main, slotsPerPage);
        return { ...p, isVariant: false };
      }
      return { page: null, slot: null, isVariant: true };
    },
    [all.main, slotsPerPage],
  );

  const celebrateAdd = useCallback(
    (card: Card): void => {
      const rarity = pickRarity(card.rarity);
      const cfg = rarityConfig(card.rarity);
      const p = placementFor(card);
      const price = formatPrice(card.price_usd ?? 0);
      const placement = p.isVariant
        ? `Collector Variant${price}`
        : p.page !== null
          ? `Page ${p.page}, Slot ${p.slot}${price}`
          : `Added${price}`;
      pushCard({
        card,
        rarity,
        rarityLabel: RARITY_LABELS[rarity],
        message: randomOf(RARITY_MSGS[rarity]),
        placement,
        glow: cfg.glow,
        border: cfg.border,
      });
      if (!muteCel) {
        spawnGlobalConfetti(card.rarity, false);
        const beforeUnique = new Set(owned).size;
        const afterUnique = new Set([...owned, card.collector_number]).size;
        const milestone = crossedMilestone(beforeUnique, afterUnique);
        if (milestone !== null) {
          // Extra celebratory burst on milestone cross — mythic-tier regardless of card rarity.
          window.setTimeout(() => spawnGlobalConfetti('mythic', false), 240);
          toast({
            title: `${milestone} unique cards collected!`,
            description: 'Milestone unlocked',
            variant: 'success',
          });
        }
      }
    },
    [pushCard, placementFor, formatPrice, muteCel, owned],
  );

  const celebrateFoil = useCallback(
    (card: Card, variantLabel: string): void => {
      const p = placementFor(card);
      const foilPrice = card.price_usd_foil ?? 0;
      const basePrice = card.price_usd ?? 0;
      const priceStr = foilPrice > 0 ? formatPrice(foilPrice, true) : formatPrice(basePrice);
      const placement = p.isVariant
        ? `Collector collection${priceStr}`
        : p.page !== null
          ? `Page ${p.page}, Slot ${p.slot}${priceStr}`
          : `Collector collection${priceStr}`;
      pushCard({
        card,
        rarity: pickRarity(card.rarity),
        rarityLabel: variantLabel,
        message: randomOf(FOIL_MSGS),
        placement,
        foilLabel: variantLabel,
        glow: 'rgba(199,125,255,0.4)',
        border: '#c77dff',
      });
      if (!muteCel) spawnGlobalConfetti(card.rarity, true);
    },
    [pushCard, placementFor, formatPrice, muteCel],
  );

  const toastRemove = useCallback((card: Card, undo: () => void): void => {
    toast({
      title: `Removed ${card.name}`,
      description: `#${card.collector_number}`,
      undo,
    });
  }, []);

  return { celebrateAdd, celebrateFoil, toastRemove };
}
