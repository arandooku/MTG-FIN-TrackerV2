import { useState, type ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
}

export function CardImage({ src, alt, fallback, className, ...rest }: CardImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const finalSrc = failed && fallback ? fallback : src;

  return (
    <div className={cn('relative overflow-hidden rounded-md bg-muted', className)}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-muted/60" />}
      <img
        src={finalSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-200',
          loaded ? 'opacity-100' : 'opacity-0',
        )}
        {...rest}
      />
    </div>
  );
}
