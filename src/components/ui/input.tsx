import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Mythic Obsidian input — glass surface, crystal-cyan focus glow.
 * 14px radius, 1px hairline border, Inter body type, tabular-nums for numeric input.
 */
export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'glass flex h-10 w-full rounded-[14px] px-3.5 py-2 text-sm',
        'font-[var(--font-body,Inter,sans-serif)]',
        'bg-[color:var(--surface-1,rgba(18,20,32,0.72))]',
        'border border-[color:var(--border-soft,rgba(255,255,255,0.10))]',
        'text-[color:var(--ink-primary,#F3F1E8)]',
        'placeholder:text-[color:var(--ink-muted,#9AA0B4)]',
        'placeholder:tracking-[0.08em] placeholder:uppercase placeholder:text-xs',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-md',
        'transition-[border-color,box-shadow] duration-200',
        'focus-visible:outline-none',
        'focus-visible:border-[color:var(--accent-crystal,#7FD8E4)]',
        'focus-visible:shadow-[0_0_0_3px_rgba(127,216,228,0.18),inset_0_1px_0_rgba(255,255,255,0.04)]',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'disabled:cursor-not-allowed disabled:opacity-50',
        type === 'number' && 'font-[var(--font-mono,monospace)] tabular-nums',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
