import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { useThemeStore } from '@/store/theme';
import { useSyncStore } from '@/store/sync';
import { relativeTime } from '@/lib/utils';

export function Header() {
  const mode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggle);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const isSyncing = useSyncStore((s) => s.isSyncing);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="inline-block h-6 w-6 rounded bg-gradient-to-br from-purple-500 to-indigo-600 shadow-inner" />
          <h1 className="font-[Cinzel] text-lg font-semibold tracking-wide">FIN Binder</h1>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {isSyncing ? (
            <span>Syncing…</span>
          ) : lastSyncedAt ? (
            <span>Synced {relativeTime(lastSyncedAt)}</span>
          ) : null}
          <Button size="icon" variant="ghost" onClick={toggle} aria-label="Toggle theme">
            {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
