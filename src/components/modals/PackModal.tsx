import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { useCollectionStore } from '@/store/collection';
import { useAllCards } from '@/hooks/useCards';
import { toast } from '@/store/toast';
import { useConfigStore } from '@/store/config';
import { celebrateCard } from '@/lib/celebration';
import { playForRarity } from '@/lib/sound';
import { CardImage } from '../CardImage';
import { classifyFoil, foilSlotClass } from '@/lib/foil';
import type { Card as CardT } from '@/lib/schemas';

interface PackModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'price' | 'cards' | 'reveal';

export function PackModal({ open, onClose }: PackModalProps) {
  const addPack = useCollectionStore((s) => s.addPack);
  const all = useAllCards();
  const muteSound = useConfigStore((s) => s.muteSound);
  const muteCel = useConfigStore((s) => s.muteCelebration);

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
        if (!muteSound) playForRarity(best.rarity, classifyFoil(best) !== 'none');
        if (!muteCel) {
          // Run celebration on a transient canvas
          const canvas = document.getElementById('pack-celebration-canvas') as HTMLCanvasElement | null;
          celebrateCard(best, canvas, classifyFoil(best) !== 'none');
        }
      }
      toast({ title: `Pack opened — ${found.length} cards`, variant: 'success' });
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

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="!max-w-2xl !p-0 !border-0 !bg-transparent !shadow-none">
        <div className="modal-card !max-h-[calc(100dvh-2rem)] !overflow-y-auto">
          <div className="modal-handle" />
          <DialogTitle className="sr-only">Open Pack</DialogTitle>
          <DialogDescription className="sr-only">Pack opening wizard</DialogDescription>

          <div className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg">Open a Pack</h3>
              <span className="text-xs text-[var(--text-muted)] font-num">
                Step {stepNum} / 3
              </span>
            </div>
            <div className="wizard-progress mb-5">
              <div
                className="wizard-progress-fill"
                style={{ width: `${(stepNum / 3) * 100}%` }}
              />
            </div>

            <div className="wizard-step-container relative min-h-[260px]">
              {step === 'price' && (
                <div key="step-price" className={stepClass}>
                  <h2 className="font-display text-base">Pack price</h2>
                  <p className="step-sub text-sm text-[var(--text-muted)] mb-4">
                    Track what you spent. Skip with 0.
                  </p>
                  <label className="block text-[0.7rem] uppercase tracking-widest text-[var(--text-muted)] mb-1">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="6.99"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-lg border border-[var(--ff-border)] bg-[var(--slot-bg)] px-3 py-2 text-base font-num focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              )}

              {step === 'cards' && (
                <div key="step-cards" className={stepClass}>
                  <h2 className="font-display text-base">Card list</h2>
                  <p className="step-sub text-sm text-[var(--text-muted)] mb-4">
                    Comma or space separated collector numbers.
                  </p>
                  <textarea
                    rows={5}
                    placeholder="12, 45, 103, 217..."
                    value={cnList}
                    onChange={(e) => setCnList(e.target.value)}
                    className="w-full rounded-lg border border-[var(--ff-border)] bg-[var(--slot-bg)] px-3 py-2 text-sm font-num focus:outline-none focus:border-[var(--accent)] resize-y"
                  />
                  {cards.length > 0 && (
                    <div className="mt-2 text-xs text-[var(--text-muted)]">
                      {cards.length} card{cards.length === 1 ? '' : 's'} ready
                    </div>
                  )}
                </div>
              )}

              {step === 'reveal' && (
                <div key="step-reveal" className={`${stepClass} relative`}>
                  <h2 className="font-display text-base">Pack opened</h2>
                  <p className="step-sub text-sm text-[var(--text-muted)] mb-4">
                    {revealed.length} of {cards.length} found in dataset
                  </p>
                  <div className="relative">
                    <canvas
                      id="pack-celebration-canvas"
                      className="pointer-events-none absolute inset-0 h-full w-full"
                    />
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                      {revealed.map((c, i) => (
                        <div
                          key={`${c.collector_number}-${i}`}
                          className={`pack-card-reveal delay-${Math.min(i + 1, 10)} relative overflow-hidden rounded-md`}
                          title={`${c.name} #${c.collector_number}`}
                        >
                          <CardImage
                            src={c.image_small || c.image_normal}
                            alt={c.name}
                            className="aspect-[5/7] w-full"
                          />
                          {classifyFoil(c) !== 'none' && (
                            <div className={`foil-overlay ${foilSlotClass(c)}`} />
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] font-num text-white px-1 py-0.5">
                            #{c.collector_number}
                          </div>
                        </div>
                      ))}
                      {cards.length > revealed.length && (
                        <div className="col-span-full text-xs text-[var(--text-muted)]">
                          {cards.length - revealed.length} not found in current dataset
                        </div>
                      )}
                    </div>
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
