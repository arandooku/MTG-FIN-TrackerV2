import { useState, type ImgHTMLAttributes } from 'react';
import { cn, scryfallLarge } from '@/lib/utils';

interface CardImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  hiRes?: boolean;
}

function buildSrcSet(src: string) {
  if (!src || !src.includes('scryfall')) return undefined;
  const large = scryfallLarge(src);
  if (large === src) return undefined;
  return `${src} 1x, ${large} 2x`;
}

export function CardImage({ src, alt, fallback, className, hiRes, ...rest }: CardImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const resolved = hiRes ? scryfallLarge(src) : src;
  const finalSrc = failed && fallback ? fallback : resolved;
  const srcSet = hiRes ? undefined : buildSrcSet(resolved);

  return (
    <div className={cn('relative overflow-hidden rounded-md bg-muted', className)}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-muted/60" />}
      <img
        src={finalSrc}
        srcSet={srcSet}
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
