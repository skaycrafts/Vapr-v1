'use client';

import { useRef, type ReactNode } from 'react';
import { gsap } from '@/lib/gsap';
import { useCapability } from '@/motion/capability';
import { useMotionEffect } from '@/motion/useMotionEffect';
import { damp } from '@/lib/utils';

/**
 * A control that leans very slightly toward the pointer as it approaches, and
 * settles back when it leaves.
 *
 * Used once, on Enquire. That restraint is the entire design: a magnetic
 * effect on every button is a page where nothing holds still and no control
 * is more important than any other, which is the opposite of what the effect
 * is for. Here it marks the one thing the site is actually asking you to do.
 *
 * ── Why the numbers are this small ──────────────────────────────────────
 * The ceiling is 8px of travel and the field is 1.6× the button's own size.
 * Past that the control starts to feel like it is dodging the cursor, and a
 * button that moves away from a click is a usability bug wearing a costume.
 * At this size a visitor never consciously sees it move — the button simply
 * feels slightly alive as they reach for it.
 *
 * Runs on the shared ticker rather than a private rAF, like everything else
 * that follows a pointer, and only where a fine pointer exists and motion is
 * welcome. Touch and reduced-motion get an ordinary, perfectly good button.
 */
export default function Magnetic({
  children,
  className,
  /** Maximum travel in pixels. §21 keeps micro-movement to 2–10px. */
  strength = 8,
  /** Field radius, as a multiple of the element's own half-size. */
  reach = 1.6,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
  reach?: number;
}) {
  const root = useRef<HTMLSpanElement>(null);
  const { pointerMotion } = useCapability();

  useMotionEffect(
    root,
    () => {
      const el = root.current;
      if (!el || !pointerMotion) return;

      const target = { x: 0, y: 0 };
      const pos = { x: 0, y: 0 };
      const setX = gsap.quickSetter(el, 'x', 'px');
      const setY = gsap.quickSetter(el, 'y', 'px');

      const onMove = (e: PointerEvent) => {
        // Measured per event: the button moves under the pointer as the page
        // scrolls, so a cached box goes stale immediately.
        const b = el.getBoundingClientRect();
        const cx = b.left + b.width / 2;
        const cy = b.top + b.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;

        // An ellipse around the control, not a circle: a wide pill has far
        // more horizontal presence than vertical, and a circular field makes
        // it pull from dead space above and below.
        const rx = (b.width / 2) * reach;
        const ry = (b.height / 2) * reach;
        const d = Math.hypot(dx / rx, dy / ry);

        if (d > 1) {
          target.x = 0;
          target.y = 0;
          return;
        }
        // Falls off toward the edge of the field, so the control is most
        // attentive when the pointer is nearly on it.
        const pull = 1 - d;
        target.x = (dx / rx) * strength * pull;
        target.y = (dy / ry) * strength * pull;
      };

      const tick = () => {
        const dt = gsap.ticker.deltaRatio(60) / 60;
        pos.x = damp(pos.x, target.x, 0.16, dt);
        pos.y = damp(pos.y, target.y, 0.16, dt);
        setX(pos.x);
        setY(pos.y);
      };

      window.addEventListener('pointermove', onMove, { passive: true });
      gsap.ticker.add(tick);

      return () => {
        window.removeEventListener('pointermove', onMove);
        gsap.ticker.remove(tick);
        gsap.set(el, { x: 0, y: 0 });
      };
    },
    [pointerMotion, strength, reach]
  );

  // `inline-block` so the transform has something to act on; the child keeps
  // its own layout and its own hit area.
  return (
    <span ref={root} className={className} style={{ display: 'inline-block' }}>
      {children}
    </span>
  );
}
