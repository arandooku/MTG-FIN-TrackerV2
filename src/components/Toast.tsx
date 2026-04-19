import { cn } from '@/lib/utils';
import { useToastStore } from '@/store/toast';

export function Toast() {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-50 flex flex-col gap-2">
      {items.map((i) => (
        <button
          key={i.id}
          type="button"
          onClick={() => dismiss(i.id)}
          className={cn(
            'pointer-events-auto min-w-64 rounded-lg border px-4 py-3 text-left shadow-lg backdrop-blur',
            i.variant === 'success' && 'border-green-500/50 bg-green-500/10',
            i.variant === 'error' && 'border-destructive/60 bg-destructive/10',
            (!i.variant || i.variant === 'default') && 'border-border bg-card',
          )}
        >
          <div className="text-sm font-semibold">{i.title}</div>
          {i.description && <div className="text-xs text-muted-foreground">{i.description}</div>}
        </button>
      ))}
    </div>
  );
}
