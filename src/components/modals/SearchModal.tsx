import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Transition, Variants } from 'framer-motion';
import { Package, Moon, Sun, RefreshCw, Scan, Search as SearchIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { CardImage } from '../CardImage';
import { useAllCards } from '@/hooks/useCards';
import { fuzzyMatchName } from '@/lib/binder';
import { classifyFoil } from '@/lib/foil';
import { FoilOverlay } from '../FoilOverlay';
import { useThemeStore } from '@/store/theme';
import { useSyncStore } from '@/store/sync';
import { cn } from '@/lib/utils';
import type { Card as CardT } from '@/lib/schemas';

type Filter = 'all' | 'main' | 'variant' | 'foil-only';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  onPick: (card: CardT) => void;
  onOpenPack?: () => void;
}

const SPRING_SNAPPY: Transition = { type: 'spring', stiffness: 400, damping: 32 };
const SPRING_SMOOTH: Transition = { type: 'spring', stiffness: 260, damping: 26 };
const MAX_ANIMATED_RESULTS = 20;

export function SearchModal({ open, onClose, onPick, onOpenPack }: SearchModalProps) {
  const prefersReduced = useReducedMotion();
  const { main, variants } = useAllCards();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const mode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const isSyncing = useSyncStore((s) => s.isSyncing);
  const pushSync = useSyncStore((s) => s.push);

  const pool = useMemo(() => {
    if (filter === 'main') return main;
    if (filter === 'variant') return variants;
    if (filter === 'foil-only') return [...main, ...variants].filter((c) => classifyFoil(c) !== 'none');
    return [...main, ...variants];
  }, [main, variants, filter]);

  const matches = useMemo(() => {
    if (!query) return pool.slice(0, 30);
    return fuzzyMatchName(query, pool, 36);
  }, [pool, query]);

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
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: SPRING_SNAPPY },
        exit: { opacity: 0, y: 4, transition: { duration: 0.12 } },
      };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={cn(
          'searchmodal-sheet !max-w-[720px] !p-0 !border-0 !bg-transparent !shadow-none',
        )}
      >
        <motion.div
          className={cn(
            'glass-raised modal-card relative !max-h-[85vh] overflow-hidden',
            'rounded-[22px]',
          )}
          variants={shellVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          style={{
            willChange: 'transform, opacity',
            background: 'var(--surface-raised, rgba(40,42,58,0.92))',
            backdropFilter: 'blur(28px)',
            border: '1px solid var(--border-glow, rgba(170,200,255,0.18))',
            boxShadow:
              '0 24px 72px rgba(0,0,0,0.55), 0 0 0 1px rgba(170,200,255,0.10), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          <DialogTitle className="sr-only">Search Cards</DialogTitle>
          <DialogDescription className="sr-only">Find cards by name or collector number</DialogDescription>

          {/* Command-palette-style search row */}
          <motion.div
            className="flex items-center gap-3 px-5 py-4"
            style={{ borderBottom: '1px solid var(--border-hair, rgba(255,255,255,0.06))' }}
            variants={sectionVariants}
          >
            <SearchIcon
              className="h-5 w-5"
              style={{ color: 'var(--accent-crystal, #7FD8E4)' }}
            />
            <input
              autoFocus
              placeholder="SEARCH THE TOME…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={cn(
                'flex-1 bg-transparent focus:outline-none py-1',
                'placeholder:uppercase placeholder:tracking-[0.22em] placeholder:text-sm',
              )}
              style={{
                fontFamily: 'var(--font-body, Inter, sans-serif)',
                color: 'var(--ink-primary, #F3F1E8)',
                fontSize: 'var(--fs-body-lg, clamp(0.95rem, 1.6vw, 1.05rem))',
                minHeight: 44,
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow =
                  '0 0 0 0 transparent';
              }}
            />
          </motion.div>

          {/* Quick actions row — glass pills */}
          <motion.div
            className="search-quick-row flex flex-wrap gap-2 px-5 py-3"
            style={{ borderBottom: '1px solid var(--border-hair, rgba(255,255,255,0.06))' }}
            variants={sectionVariants}
          >
            <GlassChip onClick={() => onOpenPack?.()}>
              <Package className="h-3.5 w-3.5" /> Open Pack
            </GlassChip>
            <GlassChip onClick={toggleTheme}>
              {mode === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />} Theme
            </GlassChip>
            <GlassChip onClick={() => pushSync()} disabled={isSyncing}>
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} /> Sync
            </GlassChip>
            <GlassChip onClick={() => onClose()}>
              <Scan className="h-3.5 w-3.5" /> Scan
            </GlassChip>
          </motion.div>

          {/* Filter chips */}
          <motion.div
            className="flex flex-wrap gap-2 px-5 py-3"
            style={{ borderBottom: '1px solid var(--border-hair, rgba(255,255,255,0.06))' }}
            variants={sectionVariants}
          >
            <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
              All
            </FilterChip>
            <FilterChip active={filter === 'main'} onClick={() => setFilter('main')}>
              Main Set
            </FilterChip>
            <FilterChip active={filter === 'variant'} onClick={() => setFilter('variant')}>
              Variants
            </FilterChip>
            <FilterChip active={filter === 'foil-only'} onClick={() => setFilter('foil-only')}>
              Foil
            </FilterChip>
          </motion.div>

          <div className="searchmodal-results">
            <AnimatePresence mode="popLayout">
              {matches.map((c, i) => {
                const variant = classifyFoil(c);
                const animated = i < MAX_ANIMATED_RESULTS;
                const usd = c.price_usd ?? 0;
                return (
                  <motion.button
                    type="button"
                    key={c.collector_number}
                    onClick={() => {
                      onPick(c);
                      onClose();
                    }}
                    className={cn(
                      'glass group relative space-y-1 overflow-hidden rounded-[12px] p-1.5 text-left',
                      'border border-[color:var(--border-hair,rgba(255,255,255,0.06))]',
                      'transition-[transform,border-color,box-shadow] duration-200',
                      'hover:-translate-y-0.5 hover:border-[color:var(--border-glow,rgba(170,200,255,0.18))]',
                      'hover:shadow-[0_8px_24px_rgba(0,0,0,0.45),0_0_18px_rgba(127,216,228,0.18)]',
                    )}
                    style={{ background: 'var(--surface-1, rgba(18,20,32,0.72))' }}
                    initial={
                      prefersReduced || !animated
                        ? { opacity: 0 }
                        : { opacity: 0, y: 12 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.12 } }}
                    transition={
                      prefersReduced
                        ? { duration: 0.12 }
                        : {
                            ...SPRING_SNAPPY,
                            delay: animated ? i * 0.02 : 0,
                          }
                    }
                  >
                    <div className="relative overflow-hidden rounded-[8px]">
                      <CardImage src={c.image_small} alt={c.name} className="aspect-[5/7]" />
                      {variant !== 'none' && <FoilOverlay card={c} />}
                    </div>
                    <div className="flex items-center gap-1.5 px-0.5 pt-0.5">
                      <RarityDot rarity={c.rarity} />
                      <div
                        className="truncate text-xs font-semibold"
                        style={{
                          fontFamily: 'var(--font-display, Cinzel, serif)',
                          color: 'var(--ink-primary, #F3F1E8)',
                          letterSpacing: '0.02em',
                        }}
                      >
                        {c.name}
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-0.5 pb-0.5">
                      <span
                        className="text-[10px] tabular-nums"
                        style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          color: 'var(--ink-muted, #9AA0B4)',
                        }}
                      >
                        #{c.collector_number}
                      </span>
                      <span
                        className="text-[10px] tabular-nums"
                        style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          color: usd ? 'var(--accent-gold, #E8C77A)' : 'var(--ink-subtle, #5A6078)',
                        }}
                      >
                        {usd ? `$${usd.toFixed(2)}` : '—'}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
            {!matches.length && (
              <motion.div
                className="col-span-full py-10 text-center text-sm"
                style={{
                  color: 'var(--ink-muted, #9AA0B4)',
                  fontFamily: 'var(--font-display, Cinzel, serif)',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {query ? 'No matches' : 'Start typing to search'}
              </motion.div>
            )}
          </div>

          {/* Keyboard hints strip — bottom mono muted */}
          <div
            className={cn(
              'flex items-center justify-between gap-3 px-5 py-2.5 text-[10px] tabular-nums',
            )}
            style={{
              borderTop: '1px solid var(--border-hair, rgba(255,255,255,0.06))',
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--ink-muted, #9AA0B4)',
            }}
          >
            <span className="flex items-center gap-3">
              <KeyHint label="Enter" /> select
              <KeyHint label="Esc" /> close
            </span>
            <span style={{ color: 'var(--ink-subtle, #5A6078)' }}>
              {matches.length} result{matches.length === 1 ? '' : 's'}
            </span>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

interface ChipProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

function GlassChip({ onClick, disabled, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold',
        'border border-[color:var(--border-soft,rgba(255,255,255,0.10))] backdrop-blur-md',
        'transition-[border-color,box-shadow,color] duration-200',
        'hover:border-[color:var(--accent-crystal,#7FD8E4)]',
        'hover:text-[color:var(--ink-primary,#F3F1E8)]',
        'disabled:opacity-50 disabled:pointer-events-none',
      )}
      style={{
        background: 'var(--surface-1, rgba(18,20,32,0.72))',
        color: 'var(--ink-secondary, #C8CBD8)',
        fontFamily: 'var(--font-display, Cinzel, serif)',
        letterSpacing: '0.08em',
      }}
    >
      {children}
    </button>
  );
}

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function FilterChip({ active, onClick, children }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'glass inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]',
        'transition-[border-color,box-shadow,color,background] duration-200',
        active
          ? 'border'
          : 'border border-[color:var(--border-soft,rgba(255,255,255,0.10))]',
      )}
      style={{
        background: active
          ? 'rgba(127,216,228,0.10)'
          : 'var(--surface-1, rgba(18,20,32,0.72))',
        color: active
          ? 'var(--accent-crystal, #7FD8E4)'
          : 'var(--ink-muted, #9AA0B4)',
        borderColor: active
          ? 'var(--accent-crystal, #7FD8E4)'
          : undefined,
        boxShadow: active
          ? '0 0 0 3px rgba(127,216,228,0.14)'
          : undefined,
        fontFamily: 'var(--font-display, Cinzel, serif)',
      }}
    >
      {children}
    </button>
  );
}

const RARITY_DOT: Record<string, string> = {
  mythic: 'var(--accent-mythic, #FF7A5A)',
  rare: 'var(--accent-gold, #E8C77A)',
  uncommon: '#C0CCDB',
  common: 'var(--ink-subtle, #5A6078)',
};

function RarityDot({ rarity }: { rarity: string }) {
  return (
    <span
      aria-hidden
      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
      style={{
        background: RARITY_DOT[rarity] ?? RARITY_DOT.common,
        boxShadow: `0 0 6px ${RARITY_DOT[rarity] ?? RARITY_DOT.common}`,
      }}
    />
  );
}

function KeyHint({ label }: { label: string }) {
  return (
    <kbd
      className="inline-flex h-5 items-center rounded-[6px] px-1.5 text-[10px] tabular-nums"
      style={{
        background: 'var(--surface-1, rgba(18,20,32,0.72))',
        color: 'var(--ink-secondary, #C8CBD8)',
        border: '1px solid var(--border-soft, rgba(255,255,255,0.10))',
        fontFamily: 'var(--font-mono, monospace)',
      }}
    >
      {label}
    </kbd>
  );
}
