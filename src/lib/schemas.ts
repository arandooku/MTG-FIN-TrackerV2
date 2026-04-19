import { z } from 'zod';

export const CollectorNumber = z
  .string()
  .regex(/^\d{1,4}[a-z]?$/i, 'Invalid collector number');

export const Card = z.object({
  collector_number: z.string(),
  name: z.string(),
  rarity: z.string(),
  type_line: z.string().optional().default(''),
  mana_cost: z.string().optional().default(''),
  image_small: z.string().optional().default(''),
  image_normal: z.string().optional().default(''),
  image_back_small: z.string().optional().default(''),
  image_back_normal: z.string().optional().default(''),
  price_usd: z.number().default(0),
  price_usd_foil: z.number().default(0),
  scryfall_uri: z.string().optional().default(''),
  finishes: z.array(z.string()).default(['nonfoil', 'foil']),
  oracle_id: z.string().optional().default(''),
  foil_only: z.boolean().default(false),
  frame_effects: z.array(z.string()).default([]),
  promo_types: z.array(z.string()).default([]),
});
export type Card = z.infer<typeof Card>;

export const TimelineEvent = z.object({
  type: z.enum(['add', 'remove', 'pack']),
  cn: CollectorNumber,
  date: z.string().datetime(),
  source: z.string().max(20).default('quick'),
});
export type TimelineEvent = z.infer<typeof TimelineEvent>;

export const PackCardEntry = z.union([
  CollectorNumber,
  z.object({ cn: CollectorNumber, foil: z.boolean().optional() }),
]);
export type PackCardEntry = z.infer<typeof PackCardEntry>;

export const BoosterPack = z.object({
  price: z.number().nonnegative().default(0),
  cards: z.array(PackCardEntry).default([]),
  date: z.string().datetime().optional(),
});
export type BoosterPack = z.infer<typeof BoosterPack>;

export const BinderScope = z.object({
  mainSet: z.boolean().default(true),
  collectorBinder: z.boolean().default(false),
});
export type BinderScope = z.infer<typeof BinderScope>;

export const BinderConfig = z.object({
  gridRows: z.number().int().min(1).max(10),
  gridCols: z.number().int().min(1).max(10),
  slotsPerPage: z.number().int().min(1).max(100),
  pageCount: z.number().int().min(1).max(999),
  presetName: z.string().max(30).default('9-pocket'),
  scope: BinderScope.default({ mainSet: true, collectorBinder: false }),
  configured: z.boolean().default(false),
});
export type BinderConfig = z.infer<typeof BinderConfig>;

export const FoilOwned = z.record(CollectorNumber, z.array(z.string().max(20)).max(10));
export type FoilOwned = z.infer<typeof FoilOwned>;

export const OwnedList = z.array(CollectorNumber).max(2000);
export type OwnedList = z.infer<typeof OwnedList>;

export const SyncPayload = z.object({
  collection: z.object({ owned: OwnedList }).optional(),
  packs: z.object({ packs: z.array(BoosterPack).max(5000) }).optional(),
  timeline: z.object({ events: z.array(TimelineEvent).max(20_000) }).optional(),
  binderConfig: BinderConfig.optional(),
  foil: FoilOwned.optional(),
});
export type SyncPayload = z.infer<typeof SyncPayload>;

export function safeParse<T extends z.ZodTypeAny>(schema: T, raw: unknown): z.infer<T> | null {
  const r = schema.safeParse(raw);
  return r.success ? r.data : null;
}
