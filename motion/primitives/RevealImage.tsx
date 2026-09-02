'use client';

import { useRef, type ReactNode } from 'react';
import { gsap } from '@/lib/gsap';
import { useMotionEffect } from '@/motion/useMotionEffect';
import { CINEMA, EASE } from '@/motion/config';

/**
 * The four VAPR image transitions. Four, and no more — a site that uses a
 * different reveal everywhere has no visual language, it has a showreel (§10).
 *
 *  curtain  — the frame is uncovered from the foot upward. The default, and
 *             the one that pairs with type rising into a mask.
 *  side     — uncovered left to right. For horizontal movement: the gallery,
 *             a property changing.
 *  expand   — opens from the centre band outward. Reserved for arrivals that
 *             should feel like a held breath: a chapter's first image.
 *  crop     — a tight inset relaxing to full bleed. The quietest of the four,
 *             for supporting imagery that should not announce itself.
 */
export type RevealStyle = 'curtain' | 'side' | 'expand' | 'crop';

const CLIP: Record<RevealStyle, { from: string; to: string }> = {
  curtain: { from: 'inset(100% 0% 0% 0%)', to: 'inset(0% 0% 0% 0%)' },
  side: { from: 'inset(0% 100% 0% 0%)', to: 'inset(0% 0% 0% 0%)' },
  expand: { from: 'inset(42% 0% 42% 0%)', to: 'inset(0% 0% 0% 0%)' },
  crop: { from: 'inset(12% 8% 12% 8%)', to: 'inset(0% 0% 0% 0%)' },
};

export type RevealImageProps = {
  children: ReactNode;
  style?: RevealStyle;
  className?: string;
  start?: string;
  delay?: number;
  /**
   * The counter-scale. The inner image starts slightly larger and settles as
   * the mask opens, so the photograph is moving *with* the reveal rather than
   * being uncovered while frozen. Barely perceptible, and the whole trick.
   */
  scaleFrom?: number;
  immediate?: boolean;
};

export default function RevealImage({
  children,
  style = 'curtain',
  className,
  start = 'top 84%',
  delay = 0,
  scaleFrom = 1.14,
  immediate = false,
}: RevealImageProps) {
  const root = useRef<HTMLDivElement>(null);

  useMotionEffect(
    root,
    ({ q }) => {
      const el = root.current;
      if (!el) return;

      // The mask lives on the wrapper, the scale on whatever it contains, so
      // the two can move at different rates.
      const inner = q('[data-reveal-inner]')[0] ?? (el.firstElementChild as HTMLElement | null);
      const clip = CLIP[style];

      const tl = gsap.timeline({
        delay,
        defaults: { ease: EASE.inOutHeavy },
        scrollTrigger: immediate ? undefined : { trigger: el, start, once: true },
      });

      tl.fromTo(
        el,
        { clipPath: clip.from },
        { clipPath: clip.to, duration: CINEMA.base }
      );

      if (inner) {
        tl.fromTo(
          inner,
          { scale: scaleFrom },
          { scale: 1, duration: CINEMA.epic, ease: EASE.outLong },
          0
        );
      }
    },
    [style, delay, start, scaleFrom, immediate]
  );

  return (
    <div ref={root} className={className} data-motion="image">
      {children}
    </div>
  );
}
