import { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { Card as CardT } from '@/lib/schemas';
import { useCollectionStore } from '@/store/collection';
import { useConfigStore } from '@/store/config';
import { celebrateCard } from '@/lib/celebration';
import { playForRarity } from '@/lib/sound';
import { classifyFoil, foilLabel } from '@/lib/foil';
import { CardImage } from '../CardImage';

interface CardModalProps {
  card: CardT | null;
  onClose: () => void;
}

export function CardModal({ card, onClose }: CardModalProps) {
  const addCard = useCollectionStore((s) => s.addCard);
  const removeCard = useCollectionStore((s) => s.removeCard);
  const owned = useCollectionStore((s) => s.owned);
  const muteSound = useConfigStore((s) => s.muteSound);
  const muteCel = useConfigStore((s) => s.muteCelebration);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const count = card ? owned.filter((cn) => cn === card.collector_number).length : 0;

  useEffect(() => {
    return () => {
      /* cleanup handled by Dialog */
    };
  }, []);

  if (!card) return null;

  const handleAdd = () => {
    addCard(card.collector_number);
    if (!muteSound) playForRarity(card.rarity);
    if (!muteCel) celebrateCard(card, canvasRef.current, classifyFoil(card) !== 'none');
  };

  return (
    <Dialog open={!!card} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{card.name}</DialogTitle>
          <DialogDescription>
            #{card.collector_number} · {card.rarity} · {foilLabel(card)}
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <CardImage src={card.image_normal || card.image_small} alt={card.name} className="aspect-[5/7]" />
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Owned ×{count}</Badge>
            {card.price_usd > 0 && <Badge variant="outline">${card.price_usd.toFixed(2)}</Badge>}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={count === 0}
              onClick={() => removeCard(card.collector_number)}
            >
              − Remove
            </Button>
            <Button size="sm" onClick={handleAdd}>
              + Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
