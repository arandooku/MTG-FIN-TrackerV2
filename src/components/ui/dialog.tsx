import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Mythic Obsidian dialog — glass-raised shell, gold ornate-hr separators.
 * Backdrop is darker obsidian + heavy blur. Header/footer use Cinzel display.
 */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50',
      'bg-[rgba(5,6,10,0.78)] backdrop-blur-[14px]',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'glass-raised fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4',
        'rounded-[22px] p-6 duration-200',
        'border border-[color:var(--border-glow,rgba(170,200,255,0.18))]',
        'bg-[color:var(--surface-raised,rgba(40,42,58,0.92))] backdrop-blur-2xl',
        'shadow-[0_24px_72px_rgba(0,0,0,0.55),0_0_0_1px_rgba(170,200,255,0.10),inset_0_1px_0_rgba(255,255,255,0.05)]',
        'sm:rounded-[22px]',
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className={cn(
          'absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full',
          'text-[color:var(--accent-gold,#E8C77A)] opacity-80',
          'border border-[color:var(--border-soft,rgba(255,255,255,0.10))]',
          'bg-[color:var(--surface-1,rgba(18,20,32,0.72))] backdrop-blur-md',
          'transition-[opacity,border-color,box-shadow] duration-200',
          'hover:opacity-100 hover:border-[color:var(--accent-crystal,#7FD8E4)]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-crystal,#7FD8E4)]',
          'disabled:pointer-events-none',
        )}
      >
        <X className="h-3.5 w-3.5" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
      {...props}
    />
  );
}
export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
      {...props}
    />
  );
}

/**
 * Gold ornate hairline separator. Use between header / body / footer
 * sections inside the dialog. Decorative — aria-hidden.
 */
export function DialogSeparator({ className }: { className?: string }) {
  return (
    <div
      role="presentation"
      aria-hidden
      className={cn('ornate-hr relative my-3 h-px w-full', className)}
      style={{
        background:
          'linear-gradient(90deg, transparent 0%, rgba(232,199,122,0.45) 50%, transparent 100%)',
      }}
    />
  );
}

export const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-display text-lg font-semibold leading-none tracking-[0.04em]',
      'font-[var(--font-display,Cinzel,serif)] text-[color:var(--ink-primary,#F3F1E8)]',
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(
      'text-sm text-[color:var(--ink-muted,#9AA0B4)] font-[var(--font-body,Inter,sans-serif)]',
      className,
    )}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
