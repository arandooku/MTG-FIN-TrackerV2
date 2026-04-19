import { useMemo, useState } from 'react';
import { Package, Moon, Sun, RefreshCw, Scan } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { CardImage } from '../CardImage';
import { useAllCards } from '@/hooks/useCards';
import { fuzzyMatchName } from '@/lib/binder';
import { classifyFoil, foilSlotClass } from '@/lib/foil';
import { useThemeStore } from '@/store/theme';
import { useSyncStore } from '@/store/sync';
import type { Card as CardT } from '@/lib/schemas';

type Filter = 'all' | 'main' | 'variant' | 'foil-only';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  onPick: (card: CardT) => void;
  onOpenPack?: () => void;
}

export function SearchModal({ open, onClose, onPick, onOpenPack }: SearchModalProps) {
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

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="!max-w-2xl !p-0 !border-0 !bg-transparent !shadow-none">
        <div className="modal-card !max-h-[85vh]">
          <DialogTitle className="sr-only">Search Cards</DialogTitle>
          <DialogDescription className="sr-only">Find cards by name or collector number</DialogDescription>

          <div className="flex items-center gap-3 border-b border-[var(--ff-border)] p-4">
            <span className="text-[var(--text-muted)]">🔍</span>
            <input
              autoFocus
              placeholder="Card name or collector number..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-base font-body focus:outline-none"
            />
          </div>

          {/* Quick actions row — V1 parity */}
          <div className="search-quick-row border-b border-[var(--ff-border)] p-3">
            <button
              type="button"
              className="search-chip search-chip-pack"
              onClick={() => {
                onOpenPack?.();
              }}
            >
              <Package className="h-3.5 w-3.5" /> Open Pack
            </button>
            <button
              type="button"
              className="search-chip search-chip-theme"
              onClick={toggleTheme}
            >
              {mode === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />} Theme
            </button>
            <button
              type="button"
              className="search-chip search-chip-sync"
              onClick={() => pushSync()}
              disabled={isSyncing}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} /> Sync
            </button>
            <button
              type="button"
              className="search-chip search-chip-scan"
              onClick={() => {
                onClose();
              }}
            >
              <Scan className="h-3.5 w-3.5" /> Scan
            </button>
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-2 border-b border-[var(--ff-border)] p-3">
            <button
              type="button"
              className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`filter-chip ${filter === 'main' ? 'active' : ''}`}
              onClick={() => setFilter('main')}
            >
              Main Set
            </button>
            <button
              type="button"
              className={`filter-chip ${filter === 'variant' ? 'active' : ''}`}
              onClick={() => setFilter('variant')}
            >
              Variants
            </button>
            <button
              type="button"
              className={`filter-chip ${filter === 'foil-only' ? 'active' : ''}`}
              onClick={() => setFilter('foil-only')}
            >
              Foil
            </button>
          </div>

          <div className="grid max-h-[55vh] grid-cols-3 gap-2 overflow-y-auto p-3 sm:grid-cols-4 md:grid-cols-5">
            {matches.map((c) => {
              const variant = classifyFoil(c);
              return (
                <button
                  type="button"
                  key={c.collector_number}
                  onClick={() => {
                    onPick(c);
                    onClose();
                  }}
                  className="space-y-1 text-left transition-transform hover:-translate-y-0.5"
                >
                  <div className="relative overflow-hidden rounded">
                    <CardImage src={c.image_small} alt={c.name} className="aspect-[5/7]" />
                    {variant !== 'none' && <div className={`foil-overlay ${foilSlotClass(c)}`} />}
                  </div>
                  <div className="truncate text-xs font-semibold">{c.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)] font-num">
                    #{c.collector_number}
                  </div>
                </button>
              );
            })}
            {!matches.length && (
              <div className="col-span-full py-10 text-center text-sm text-[var(--text-muted)]">
                {query ? 'No matches' : 'Start typing to search'}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
