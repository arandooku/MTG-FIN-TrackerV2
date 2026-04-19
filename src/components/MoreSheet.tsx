import { Clock, Sparkles, Settings as Cog, Moon, Sun, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { useThemeStore } from '@/store/theme';
import type { TabKey } from '@/App';

interface MoreSheetProps {
  open: boolean;
  onClose: () => void;
  onPick: (k: TabKey) => void;
}

export function MoreSheet({ open, onClose, onPick }: MoreSheetProps) {
  const mode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggle);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="!max-w-sm !p-0 !border-0 !bg-transparent !shadow-none">
        <div className="modal-card !max-h-[60vh]">
          <div className="modal-handle" />
          <DialogTitle className="sr-only">More</DialogTitle>
          <DialogDescription className="sr-only">Additional navigation</DialogDescription>
          <div className="p-4 flex items-center justify-between">
            <div className="font-display text-base tracking-wider">MORE</div>
            <button type="button" className="btn btn-secondary !min-h-0 !py-1.5" onClick={onClose}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-4 pb-4 flex flex-col gap-2">
            <MoreItem icon={Clock} label="Timeline" onClick={() => onPick('timeline')} />
            <MoreItem icon={Sparkles} label="Collector Binder" onClick={() => onPick('collector')} />
            <MoreItem icon={Cog} label="Settings" onClick={() => onPick('settings')} />
            <MoreItem
              icon={mode === 'dark' ? Sun : Moon}
              label={mode === 'dark' ? 'Light Theme' : 'Dark Theme'}
              onClick={toggle}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface MoreItemProps {
  icon: typeof Clock;
  label: string;
  onClick: () => void;
}

function MoreItem({ icon: Icon, label, onClick }: MoreItemProps) {
  return (
    <button
      type="button"
      className="btn btn-secondary !justify-start !text-left"
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
