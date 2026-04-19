import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Transition, Variants } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { useCollectionStore } from '@/store/collection';
import { useAllCards } from '@/hooks/useCards';
import { toast } from '@/store/toast';
import { useConfigStore } from '@/store/config';
import { celebrateCard } from '@/lib/celebration';
import { useCelebrate } from '@/hooks/useCelebrate';
import { CardImage } from '../CardImage';
import { classifyFoil } from '@/lib/foil';
import { FoilOverlay } from '../FoilOverlay';
import { cn } from '@/lib/utils';
import type { Card as CardT } from '@/lib/schemas';

/**
 * Mythic Obsidian rarity glow for pack reveals. Mythic + rare get visible
 * halos to reinforce the "ritual" feel; uncommon and common stay calm.
 */
const RARITY_REVEAL_GLOW: Record<string, string> = {
  mythic:
    '0 0 0 1px rgba(255,122,90,0.45), 0 0 28px rgba(255,122,90,0.55), 0 0 60px rgba(255,122,90,0.35)',
  rare:
    '0 0 0 1px rgba(232,199,122,0.45), 0 0 22px rgba(232,199,122,0.50), 0 0 48px rgba(232,199,122,0.30)',
  uncommon: '0 0 0 1px rgba(200,203,216,0.18)',
  common: 'none',
};

interface PackModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'price' | 'cards' | 'reveal';

const SPRING_SNAPPY: Transition = { type: 'spring', stiffness: 400, damping: 32 };
const SPRING_SMOOTH: Transition = { type: 'spring', stiffness: 260, damping: 26 };
const CARD_POP: Transition = { type: 'spring', stiffness: 320, damping: 18 };

export function PackModal({ open, onClose }: PackModalProps) {
  const prefersReduced = useReducedMotion();
  const addPack = useCollectionStore((s) => s.addPack);
  const all = useAllCards();
  const muteCel = useConfigStore((s) => s.muteCelebration);
  const { celebrateAdd } = useCelebrate();

  const [step, setStep] = useState<Step>('price');
  const [direction, setDirection] = useState<'fwd' | 'back'>('fwd');
  const [price, setPrice] = useState('');
  const [cnList, setCnList] = useState('');
  const [revealed, setRevealed] = useState<CardT[]>([]);

  const cards = useMemo(
    () =>
      cnList
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    [cnList],
  );

  const lookup = (cn: string): CardT | null => {
    const pool = [...all.main, ...all.variants];
    return pool.find((c) => c.collector_number === cn) ?? null;
  };

  const reset = () => {
    setStep('price');
    setDirection('fwd');
    setPrice('');
    setCnList('');
    setRevealed([]);
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const goNext = () => {
    setDirection('fwd');
    if (step === 'price') setStep('cards');
    else if (step === 'cards') {
      if (!cards.length) {
        toast({ title: 'List at least one card', variant: 'error' });
        return;
      }
      const found = cards.map(lookup).filter((c): c is CardT => !!c);
      setRevealed(found);
      setStep('reveal');
      addPack({
        price: Number.parseFloat(price) || 0,
        cards,
        date: new Date().toISOString(),
      });
      // Celebrate the highest rarity in the pack
      const best = found.reduce<CardT | null>((acc, c) => {
        const order = { common: 0, uncommon: 1, rare: 2, mythic: 3 } as Record<string, number>;
        if (!acc) return c;
        return (order[c.rarity] ?? 0) > (order[acc.rarity] ?? 0) ? c : acc;
      }, null);
      if (best) {
        if (!muteCel) {
          const canvas = document.getElementById('pack-celebration-canvas') as HTMLCanvasElement | null;
          celebrateCard(best, canvas, classifyFoil(best) !== 'none');
        }
        celebrateAdd(best);
      } else {
        toast({ title: `Pack opened — ${found.length} cards`, variant: 'success' });
      }
    }
  };
  const goBack = () => {
    setDirection('back');
    if (step === 'cards') setStep('price');
    else if (step === 'reveal') setStep('cards');
  };

  const stepNum = step === 'price' ? 1 : step === 'cards' ? 2 : 3;
  const stepClass =
    direction === 'fwd' ? 'wizard-step' : 'wizard-step enter-back';

  const shellVariants: Variants = prefersReduced
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.15 } },
        exit: { opacity: 0, transition: { duration: 0.12 } },
      }
    : {
        hidden: { opacity: 0, scale: 0.92, y: 16 },
        show: {
          opacity: 1,
          scale: 1,
          y: 0,
          transition: { ...SPRING_SMOOTH, staggerChildren: 0.04, delayChildren: 0.04 },
        },
        exit: {
          opacity: 0,
          scale: 0.96,
          y: 8,
          transition: { duration: 0.15, ease: [0.4, 0, 1, 1] },
        },
      };

  const sectionVariants: Variants = prefersReduced
    ? { hidden: { opacity: 0 }, show: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: SPRING_SNAPPY },
        exit: { opacity: 0, y: 4, transition: { duration: 0.12 } },
      };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="!max-w-2xl !p-0 !border-0 !bg-transparent !shadow-none">
        <motion.div
          className={cn(
            'glass-raised modal-card relative !max-h-[calc(100dvh-2rem)] !overflow-y-auto rounded-[22px]',
          )}
          variants={shellVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          style={{
            willChange: 'transform, opacity',
            background: 'var(--surface-2, rgba(28,30,44,0.86))',
            backdropFilter: 'blur(28px)',
            border: '1px solid var(--border-glow, rgba(170,200,255,0.18))',
            boxShadow:
              '0 24px 72px rgba(0,0,0,0.55), 0 0 0 1px rgba(170,200,255,0.10), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          <div className="modal-handle" />
          <DialogTitle className="sr-only">Open Pack</DialogTitle>
          <DialogDescription className="sr-only">Pack opening wizard</DialogDescription>

          <motion.div className="p-6" variants={sectionVariants}>
            <div className="mb-4 flex items-center justify-between">
              <h3
                className="text-display text-xl"
                style={{
                  fontFamily: 'var(--font-display, Cinzel, serif)',
                  color: 'var(--ink-primary, #F3F1E8)',
                  letterSpacing: '0.06em',
                }}
              >
                Open a Pack
              </h3>
              <span
                className="text-xs tabular-nums uppercase tracking-[0.18em]"
                style={{
                  fontFamily: 'var(--font-display, Cinzel, serif)',
                  color: 'var(--accent-gold, #E8C77A)',
                }}
              >
                Step {stepNum} / 3
              </span>
            </div>
            <div
              className="wizard-progress mb-5 h-px w-full overflow-hidden rounded-full"
              style={{ background: 'var(--border-hair, rgba(255,255,255,0.06))' }}
            >
              <div
                className="wizard-progress-fill h-full"
                style={{
                  width: `${(stepNum / 3) * 100}%`,
                  background:
                    'linear-gradient(90deg, var(--accent-gold, #E8C77A) 0%, var(--accent-crystal, #7FD8E4) 100%)',
                  boxShadow: '0 0 12px rgba(232,199,122,0.45)',
                  transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1)',
                }}
              />
            </div>
            {/* Gold ornate hairline below progress */}
            <div
              aria-hidden
              className="ornate-hr mb-4 h-px w-full"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(232,199,122,0.40) 50%, transparent 100%)',
              }}
            />

            <div className="wizard-step-container relative min-h-[260px]">
              {step === 'price' && (
                <div key="step-price" className={stepClass}>
                  <h2
                    className="text-display text-base"
                    style={{
                      fontFamily: 'var(--font-display, Cinzel, serif)',
                      color: 'var(--ink-primary, #F3F1E8)',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Pack price
                  </h2>
                  <p
                    className="step-sub text-sm mb-4"
                    style={{ color: 'var(--ink-muted, #9AA0B4)' }}
                  >
                    Track what you spent. Skip with 0.
                  </p>
                  <label
                    className="mb-1 block text-[0.7rem] uppercase tracking-[0.22em]"
                    style={{
                      color: 'var(--ink-muted, #9AA0B4)',
                      fontFamily: 'var(--font-display, Cinzel, serif)',
                    }}
                  >
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="6.99"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className={cn(
                      'glass w-full rounded-[14px] px-3.5 py-2 text-base tabular-nums',
                      'border focus:outline-none transition-[border-color,box-shadow] duration-200',
                    )}
                    style={{
                      background: 'var(--surface-1, rgba(18,20,32,0.72))',
                      color: 'var(--ink-primary, #F3F1E8)',
                      borderColor: 'var(--border-soft, rgba(255,255,255,0.10))',
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-crystal, #7FD8E4)';
                      e.currentTarget.style.boxShadow =
                        '0 0 0 3px rgba(127,216,228,0.18)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor =
                        'var(--border-soft, rgba(255,255,255,0.10))';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              )}

              {step === 'cards' && (
                <div key="step-cards" className={stepClass}>
                  <h2
                    className="text-display text-base"
                    style={{
                      fontFamily: 'var(--font-display, Cinzel, serif)',
                      color: 'var(--ink-primary, #F3F1E8)',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Card list
                  </h2>
                  <p
                    className="step-sub text-sm mb-4"
                    style={{ color: 'var(--ink-muted, #9AA0B4)' }}
                  >
                    Comma or space separated collector numbers.
                  </p>
                  <textarea
                    rows={5}
                    placeholder="12, 45, 103, 217..."
                    value={cnList}
                    onChange={(e) => setCnList(e.target.value)}
                    className={cn(
                      'glass w-full resize-y rounded-[14px] px-3.5 py-2 text-sm tabular-nums',
                      'border focus:outline-none transition-[border-color,box-shadow] duration-200',
                    )}
                    style={{
                      background: 'var(--surface-1, rgba(18,20,32,0.72))',
                      color: 'var(--ink-primary, #F3F1E8)',
                      borderColor: 'var(--border-soft, rgba(255,255,255,0.10))',
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-crystal, #7FD8E4)';
                      e.currentTarget.style.boxShadow =
                        '0 0 0 3px rgba(127,216,228,0.18)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor =
                        'var(--border-soft, rgba(255,255,255,0.10))';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  {cards.length > 0 && (
                    <div
                      className="mt-2 text-xs uppercase tracking-[0.18em]"
                      style={{
                        color: 'var(--accent-crystal, #7FD8E4)',
                        fontFamily: 'var(--font-display, Cinzel, serif)',
                      }}
                    >
                      {cards.length} card{cards.length === 1 ? '' : 's'} ready
                    </div>
                  )}
                </div>
              )}

              {step === 'reveal' && (
                <div key="step-reveal" className={`${stepClass} relative`}>
                  <h2
                    className="text-display text-base"
                    style={{
                      fontFamily: 'var(--font-display, Cinzel, serif)',
                      color: 'var(--ink-primary, #F3F1E8)',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Pack opened
                  </h2>
                  <p
                    className="step-sub text-sm mb-4"
                    style={{ color: 'var(--ink-muted, #9AA0B4)' }}
                  >
                    {revealed.length} of {cards.length} found in dataset
                  </p>
                  <div className="relative">
                    <canvas
                      id="pack-celebration-canvas"
                      className="pointer-events-none absolute inset-0 h-full w-full"
                    />
                    <motion.div
                      className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5"
                      initial="hidden"
                      animate="show"
                      variants={{
                        hidden: {},
                        show: {
                          transition: {
                            staggerChildren: prefersReduced ? 0 : 0.08,
                            delayChildren: 0.05,
                          },
                        },
                      }}
                    >
                      <AnimatePresence>
                        {revealed.map((c, i) => {
                          const glow = RARITY_REVEAL_GLOW[c.rarity] ?? RARITY_REVEAL_GLOW.common;
                          return (
                            <motion.div
                              key={`${c.collector_number}-${i}`}
                              className={`pack-card-reveal delay-${Math.min(i + 1, 10)} relative overflow-hidden rounded-[10px]`}
                              title={`${c.name} #${c.collector_number}`}
                              variants={
                                prefersReduced
                                  ? {
                                      hidden: { opacity: 0 },
                                      show: { opacity: 1, transition: { duration: 0.15 } },
                                    }
                                  : {
                                      hidden: { opacity: 0, scale: 0.6, y: 12 },
                                      show: {
                                        opacity: 1,
                                        scale: [0.6, 1.08, 1],
                                        y: 0,
                                        transition: { ...CARD_POP, times: [0, 0.6, 1] },
                                      },
                                    }
                              }
                              style={{ willChange: 'transform, opacity', boxShadow: glow }}
                            >
                              <CardImage
                                src={c.image_small || c.image_normal}
                                alt={c.name}
                                className="aspect-[5/7] w-full"
                              />
                              {classifyFoil(c) !== 'none' && <FoilOverlay card={c} />}
                              <div
                                className="absolute bottom-0 left-0 right-0 px-1.5 py-1 text-[10px] tabular-nums"
                                style={{
                                  background:
                                    'linear-gradient(180deg, transparent 0%, rgba(5,6,10,0.85) 100%)',
                                  color: 'var(--ink-primary, #F3F1E8)',
                                  fontFamily: 'var(--font-mono, monospace)',
                                }}
                              >
                                #{c.collector_number}
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                      {cards.length > revealed.length && (
                        <div className="col-span-full text-xs text-[var(--text-muted)]">
                          {cards.length - revealed.length} not found in current dataset
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-2">
              {step !== 'price' && step !== 'reveal' && (
                <button type="button" className="btn btn-secondary flex-1" onClick={goBack}>
                  ← Back
                </button>
              )}
              {step !== 'reveal' ? (
                <button type="button" className="btn btn-primary wizard-cta flex-1" onClick={goNext}>
                  {step === 'cards' ? 'Open Pack ✦' : 'Next →'}
                </button>
              ) : (
                <button type="button" className="btn btn-primary flex-1" onClick={handleClose}>
                  Done
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
