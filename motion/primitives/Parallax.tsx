'use client';

import { useRef, type ReactNode } from 'react';
import { gsap } from '@/lib/gsap';
import { useCapability } from '@/motion/capability';
import { useMotionEffect } from '@/motion/useMotionEffect';
import { DRIFT, EASE, MOUSE, SCRUB } from '@/motion/config';
import { damp } from '@/lib/utils';

export type ParallaxProps = {
  children: ReactNode;
  className?: string;
  /**
   * Travel in percent of the element's height, across the full time it is on
   * screen. Positive drifts against the scroll — the image lags the page,
   * which is what reads as depth.
   */
  amount?: number;
  layer?: keyof typeof DRIFT;
  /** Adds pointer-driven depth on top of the scroll drift (§12). */
  mouse?: boolean | keyof typeof MOUSE;
};

/**
 * Scroll and pointer parallax.
 *
 * The ceilings in `config` are low by design: 12% of height on scroll, 10px on
 * the pointer. The test in §12 is that the visitor should feel depth without
 * being able to name the effect — anything larger and the page starts sliding
 * around under the type.
 *
 * Pointer parallax is gated on `pointerMotion`, so touch devices never carry
 * the listener and reduced-motion visitors never see it.
 */
export default function Parallax({
  children,
  className,
  amount,
  layer = 'image',
  mouse = false,
}: ParallaxProps) {
  const root = useRef<HTMLDivElement>(null);
  const { pointerMotion } = useCapability();
  const travel = amount ?? DRIFT[layer];

  useMotionEffect(
    root,
    () => {
      const el = root.current;
      if (!el) return;

      const inner = (el.firstElementChild as HTMLElement | null) ?? el;

      gsap.fromTo(
        inner,
        { yPercent: -travel / 2 },
        {
          yPercent: travel / 2,
          ease: EASE.none,
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: SCRUB.tight,
            invalidateOnRefresh: true,
          },
        }
      );
    },
    [travel]
  );

  // Pointer depth runs outside GSAP: it is a continuous damped follow rather
  // than a timeline, and driving it through the ticker keeps it on the same
  // clock as everything else.
  useMotionEffect(
    root,
    () => {
      if (!mouse || !pointerMotion) return;
      const el = root.current;
      if (!el) return;

      const inner = (el.firstElementChild as HTMLElement | null) ?? el;
      const ceiling = MOUSE[typeof mouse === 'string' ? mouse : 'image'];

      const target = { x: 0, y: 0 };
      const pos = { x: 0, y: 0 };
      const quickX = gsap.quickSetter(inner, 'x', 'px');
      const quickY = gsap.quickSetter(inner, 'y', 'px');

      const onMove = (e: PointerEvent) => {
        // Measured per event rather than cached: the section moves under the
        // pointer as the page scrolls, so a cached box goes stale immediately.
        const box = el.getBoundingClientRect();
        target.x = ((e.clientX - (box.left + box.width / 2)) / (box.width / 2)) * ceiling;
        target.y = ((e.clientY - (box.top + box.height / 2)) / (box.height / 2)) * ceiling;
      };

      const tick = () => {
        const dt = gsap.ticker.deltaRatio(60) / 60;
        pos.x = damp(pos.x, target.x, 0.08, dt);
        pos.y = damp(pos.y, target.y, 0.08, dt);
        quickX(pos.x);
        quickY(pos.y);
      };

      window.addEventListener('pointermove', onMove, { passive: true });
      gsap.ticker.add(tick);

      return () => {
        window.removeEventListener('pointermove', onMove);
        gsap.ticker.remove(tick);
      };
    },
    [mouse, pointerMotion]
  );

  return (
    <div ref={root} className={className} data-motion="parallax">
      {children}
    </div>
  );
}
