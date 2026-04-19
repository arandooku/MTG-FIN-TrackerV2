import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useCollectionStore } from '@/store/collection';
import { toast } from '@/store/toast';

interface PackModalProps {
  open: boolean;
  onClose: () => void;
}

export function PackModal({ open, onClose }: PackModalProps) {
  const addPack = useCollectionStore((s) => s.addPack);
  const [price, setPrice] = useState('');
  const [cnList, setCnList] = useState('');

  const submit = () => {
    const cards = cnList
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!cards.length) {
      toast({ title: 'No cards listed', variant: 'error' });
      return;
    }
    addPack({
      price: Number.parseFloat(price) || 0,
      cards,
      date: new Date().toISOString(),
    });
    toast({ title: `Pack logged (${cards.length} cards)`, variant: 'success' });
    setPrice('');
    setCnList('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a Pack</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="price">Price paid (USD)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cns">Collector numbers (comma or space separated)</Label>
            <Input
              id="cns"
              placeholder="12, 45, 103..."
              value={cnList}
              onChange={(e) => setCnList(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={submit}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
