import { cn } from '@/lib/utils';
import { useToastStore } from '@/store/toast';

export function Toast() {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[1000] flex flex-col items-center gap-2 px-4">
      {items.map((i) => (
        <button
          key={i.id}
          type="button"
          onClick={() => dismiss(i.id)}
          className={cn(
            'toast pointer-events-auto !static !translate-x-0 min-w-64 max-w-md',
            i.variant === 'success' && '!border-[#4aad5e] !text-[#4aad5e]',
            i.variant === 'error' && '!border-[#dc4646] !text-[#dc4646]',
          )}
        >
          <div className="text-sm font-semibold">{i.title}</div>
          {i.description && (
            <div className="text-xs text-[var(--text-muted)] mt-0.5">{i.description}</div>
          )}
        </button>
      ))}
    </div>
  );
}
