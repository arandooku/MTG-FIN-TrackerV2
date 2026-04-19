import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { CardImage } from '../CardImage';
import { useAllCards } from '@/hooks/useCards';
import { fuzzyMatchName } from '@/lib/binder';
import type { Card as CardT } from '@/lib/schemas';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  onPick: (card: CardT) => void;
}

export function SearchModal({ open, onClose, onPick }: SearchModalProps) {
  const { main, variants } = useAllCards();
  const [query, setQuery] = useState('');

  const matches = useMemo(() => {
    if (!query) return [];
    return fuzzyMatchName(query, [...main, ...variants], 15);
  }, [main, variants, query]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Search Cards</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          placeholder="Card name or collector number..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="grid max-h-96 grid-cols-3 gap-2 overflow-y-auto">
          {matches.map((c) => (
            <button
              type="button"
              key={c.collector_number}
              onClick={() => {
                onPick(c);
                onClose();
              }}
              className="space-y-1 rounded border p-1 text-left hover:bg-accent"
            >
              <CardImage src={c.image_small} alt={c.name} className="aspect-[5/7]" />
              <div className="truncate text-xs">{c.name}</div>
              <div className="text-[10px] text-muted-foreground">#{c.collector_number}</div>
            </button>
          ))}
          {!matches.length && query && (
            <div className="col-span-full py-6 text-center text-sm text-muted-foreground">
              No matches
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
