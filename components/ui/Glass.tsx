'use client';

import { useEffect, useRef } from 'react';
import liquidGlass from '@/lib/vendor/liquid-glass';
import { cn } from '@/lib/utils';

/**
 * A real refracting glass panel: the module owns the optics (SVG displacement
 * map, backdrop filter, frosted fallback for Safari and Firefox) and the
 * classes here supply the material — tint, specular top edge, hairline rim,
 * cast shadow.
 *
 * Used deliberately and twice: the navigation and the reserve panel, both of
 * which float over photography and need to stay legible without becoming an
 * opaque bar. It is not a decorative default.
 */
export default function Glass({
  as: Tag = 'div',
  className,
  children,
  scale = -78,
  chroma = 4,
  blur = 5,
  radius,
  ...rest
}: {
  as?: 'div' | 'nav' | 'aside' | 'section';
  className?: string;
  children?: React.ReactNode;
  scale?: number;
  chroma?: number;
  blur?: number;
  radius?: number;
} & React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Refraction is GPU work; the module already caps itself, but skip it
    // entirely for anyone who asked for less motion and heavy effects.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const handle = liquidGlass(el, {
      scale,
      chroma,
      blur,
      saturate: 1.25,
      mapBlur: 14,
      border: 0.08,
      radius: radius ?? null,
      fallbackBlur: 14,
    });
    return () => handle.destroy();
  }, [scale, chroma, blur, radius]);

  return (
    <Tag
      ref={ref as never}
      className={cn(
        'relative isolate',
        // Material dressing. The rim highlight is what sells it as glass.
        'bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-chalk)_9%,transparent),color-mix(in_oklab,var(--color-void)_34%,transparent))]',
        'shadow-[0_18px_46px_-12px_rgba(0,0,0,0.66),inset_0_1px_0_0_color-mix(in_oklab,var(--color-chalk)_36%,transparent),inset_0_0_0_1px_color-mix(in_oklab,var(--color-chalk)_12%,transparent)]',
        'supports-[not_(backdrop-filter:blur(1px))]:bg-carbon/92',
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
