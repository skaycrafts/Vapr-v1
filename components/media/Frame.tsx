'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { image, srcSet, fallbackSrc, type ImageSlug } from '@/lib/media';

export type FrameProps = {
  slug: ImageSlug;
  /** Overrides the alt written into the media manifest. */
  alt?: string;
  className?: string;
  imgClassName?: string;
  sizes?: string;
  priority?: boolean;
  /** CSS `object-position`, e.g. `'50% 30%'`. */
  position?: string;
  /**
   * `'auto'` uses the photograph's own ratio, a number locks the box to that
   * ratio, and `'fill'` sets no ratio at all — for the cases where the parent
   * already has a size, or the box needs to change shape at a breakpoint.
   */
  ratio?: number | 'auto' | 'fill';
  /**
   * Set to `'anonymous'` where the same file is also loaded as a WebGL
   * texture. three.js requests with CORS, and without a matching attribute
   * here the browser keeps two copies and fetches the image twice.
   */
  crossOrigin?: 'anonymous' | 'use-credentials';
};

/**
 * A graded still, served as AVIF with a WebP fallback.
 *
 * The 20px placeholder is painted underneath and cross-fades out once the
 * real file decodes, so a slow connection never shows an empty rectangle.
 * The `<img>` itself is never hidden — if scripting fails the photograph
 * still renders.
 */
export default function Frame({
  slug,
  alt,
  className,
  imgClassName,
  sizes = '100vw',
  priority = false,
  position = '50% 50%',
  ratio = 'auto',
  crossOrigin,
}: FrameProps) {
  const meta = image(slug);
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  // A cached image can finish decoding before React attaches `onLoad`, in
  // which case the event never arrives and the placeholder sticks. Check the
  // element's own state once it is mounted.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    <div
      className={cn('relative overflow-hidden bg-pitch', className)}
      style={ratio === 'fill' ? undefined : { aspectRatio: ratio === 'auto' ? meta.aspect : ratio }}
    >
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 scale-110 bg-cover bg-center blur-xl transition-opacity duration-700 ease-[var(--ease-out-quart)]',
          loaded ? 'opacity-0' : 'opacity-100'
        )}
        style={{ backgroundImage: `url("${meta.lqip}")` }}
      />
      <picture>
        <source type="image/avif" srcSet={srcSet(slug, 'avif')} sizes={sizes} />
        <source type="image/webp" srcSet={srcSet(slug, 'webp')} sizes={sizes} />
        <img
          ref={ref}
          src={fallbackSrc(slug)}
          alt={alt ?? meta.alt}
          crossOrigin={crossOrigin}
          width={meta.width}
          height={meta.height}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding={priority ? 'sync' : 'async'}
          onLoad={() => setLoaded(true)}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-[var(--ease-out-quart)]',
            loaded ? 'opacity-100' : 'opacity-0',
            imgClassName
          )}
          style={{ objectPosition: position }}
        />
      </picture>
    </div>
  );
}
