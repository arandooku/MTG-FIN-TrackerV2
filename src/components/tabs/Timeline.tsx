import { useMemo } from 'react';
import { useCollectionStore } from '@/store/collection';
import { relativeTime } from '@/lib/utils';
import { Badge } from '../ui/badge';

export function Timeline() {
  const events = useCollectionStore((s) => s.timeline);

  const sorted = useMemo(
    () => [...events].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 200),
    [events],
  );

  if (sorted.length === 0) {
    return <div className="py-12 text-center text-muted-foreground">No activity yet.</div>;
  }

  return (
    <ol className="space-y-2">
      {sorted.map((e, idx) => (
        <li
          key={`${e.date}-${e.cn}-${idx}`}
          className="flex items-center justify-between rounded-md border px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <Badge variant={e.type === 'remove' ? 'destructive' : 'secondary'}>{e.type}</Badge>
            <span className="font-mono text-sm">#{e.cn}</span>
            <span className="text-xs text-muted-foreground">{e.source}</span>
          </div>
          <span className="text-xs text-muted-foreground">{relativeTime(e.date)}</span>
        </li>
      ))}
    </ol>
  );
}
