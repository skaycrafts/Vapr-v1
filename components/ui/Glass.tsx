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

    /**
     * Refraction is the expensive half of this component: each instance
     * rasterises its own displacement map to a canvas, hangs an SVG filter off
     * it, and asks the compositor to run that filter over everything behind it
     * on every frame the panel moves.
     *
     * Two cases skip it and keep only the material — the tint, the rim
     * highlight and the shadow, which is what actually reads as glass:
     *
     *  reduced motion — heavy effects are part of what that preference means;
     *  narrow screens — several refracting panes over a scrolling page is
     *    real GPU work on a phone, and at that size the displacement is too
     *    small to see. Paying for an effect nobody can perceive is the
     *    definition of a bad trade.
     *
     * Re-evaluated on change rather than read once, so rotating a tablet
     * across the breakpoint does the right thing.
     */
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const wide = window.matchMedia('(min-width: 768px)');

    let handle: { destroy: () => void } | null = null;

    const apply = () => {
      handle?.destroy();
      handle = null;
      if (reduce.matches || !wide.matches) return;

      handle = liquidGlass(el, {
        scale,
        chroma,
        blur,
        saturate: 1.25,
        mapBlur: 14,
        border: 0.08,
        radius: radius ?? null,
        fallbackBlur: 14,
      });
    };

    apply();
    reduce.addEventListener('change', apply);
    wide.addEventListener('change', apply);

    return () => {
      reduce.removeEventListener('change', apply);
      wide.removeEventListener('change', apply);
      handle?.destroy();
    };
  }, [scale, chroma, blur, radius]);

  return (
    <Tag
      ref={ref as never}
      className={cn(
        'relative isolate',
        // Material dressing. The rim highlight is what sells it as glass.
        'bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-ink)_9%,transparent),color-mix(in_oklab,var(--color-paper)_34%,transparent))]',
        'shadow-[0_18px_46px_-12px_rgba(0,0,0,0.66),inset_0_1px_0_0_color-mix(in_oklab,var(--color-ink)_36%,transparent),inset_0_0_0_1px_color-mix(in_oklab,var(--color-ink)_12%,transparent)]',
        'supports-[not_(backdrop-filter:blur(1px))]:bg-carbon/92',
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
