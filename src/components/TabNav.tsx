import { BookOpen, Clock, Gauge, Package, Settings as Cog, Sparkles } from 'lucide-react';
import type { TabKey } from '@/App';
import { cn } from '@/lib/utils';

interface TabNavProps {
  active: TabKey;
  onChange: (t: TabKey) => void;
}

const TABS: Array<{ key: TabKey; label: string; icon: typeof Gauge }> = [
  { key: 'dashboard', label: 'Dashboard', icon: Gauge },
  { key: 'portfolio', label: 'Portfolio', icon: Package },
  { key: 'timeline', label: 'Timeline', icon: Clock },
  { key: 'binder', label: 'Binder', icon: BookOpen },
  { key: 'collector', label: 'Collector', icon: Sparkles },
  { key: 'settings', label: 'Settings', icon: Cog },
];

export function TabNav({ active, onChange }: TabNavProps) {
  return (
    <nav className="sticky top-14 z-30 border-b border-border/60 bg-background/80 backdrop-blur md:static">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 py-2 scrollbar-none">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
              active === key
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
