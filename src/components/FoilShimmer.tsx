import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FoilShimmerProps {
  active?: boolean;
  className?: string;
  children: ReactNode;
}

export function FoilShimmer({ active = true, className, children }: FoilShimmerProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {active && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-screen"
          style={{
            background:
              'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.55) 45%, rgba(179,107,255,0.6) 55%, transparent 70%)',
            backgroundSize: '250% 250%',
            animation: 'foil-shimmer 3.5s linear infinite',
          }}
        />
      )}
    </div>
  );
}
