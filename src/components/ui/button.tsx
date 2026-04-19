import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Mythic Obsidian button — luxury dark with crystalline focus ring.
 * Variants:
 *   default/primary  → gold fill on dark ink
 *   secondary        → glass capsule (translucent surface, hairline border)
 *   ghost            → transparent
 *   destructive      → danger fill
 *   outline / link   → preserved for compatibility
 */
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px]',
    'font-[var(--font-display,Cinzel,serif)] text-sm font-semibold tracking-[0.06em]',
    'transition-[background,box-shadow,border-color,transform,color] duration-200',
    'focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-[color:var(--accent-crystal,#7FD8E4)]',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-obsidian,#0A0B10)]',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98]',
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'glow-gold text-[#0A0B10]',
          'bg-[color:var(--accent-gold,#E8C77A)]',
          'shadow-[0_8px_24px_rgba(232,199,122,0.22),inset_0_1px_0_rgba(255,255,255,0.35)]',
          'hover:brightness-110',
        ].join(' '),
        destructive: [
          'text-[color:var(--ink-primary,#F3F1E8)]',
          'bg-[color:var(--danger,#FF6B7A)]',
          'shadow-[0_8px_24px_rgba(255,107,122,0.25)]',
          'hover:brightness-110',
        ].join(' '),
        outline: [
          'glass border border-[color:var(--border-soft,rgba(255,255,255,0.1))]',
          'text-[color:var(--ink-primary,#F3F1E8)]',
          'bg-[color:var(--surface-1,rgba(18,20,32,0.72))]',
          'hover:border-[color:var(--accent-crystal,#7FD8E4)]',
        ].join(' '),
        secondary: [
          'glass border border-[color:var(--border-soft,rgba(255,255,255,0.1))]',
          'text-[color:var(--ink-secondary,#C8CBD8)]',
          'bg-[color:var(--surface-1,rgba(18,20,32,0.72))]',
          'backdrop-blur-md',
          'hover:text-[color:var(--ink-primary,#F3F1E8)]',
          'hover:border-[color:var(--border-glow,rgba(170,200,255,0.18))]',
        ].join(' '),
        ghost: [
          'text-[color:var(--ink-secondary,#C8CBD8)]',
          'bg-transparent border border-transparent',
          'hover:text-[color:var(--ink-primary,#F3F1E8)]',
          'hover:bg-[color:var(--surface-1,rgba(18,20,32,0.72))]',
        ].join(' '),
        link: 'text-[color:var(--accent-crystal,#7FD8E4)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 rounded-[10px] px-3 text-xs',
        lg: 'h-11 rounded-[14px] px-7 text-[0.95rem]',
        icon: 'h-10 w-10 rounded-[12px]',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export { buttonVariants };
