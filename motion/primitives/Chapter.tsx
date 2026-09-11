'use client';

import { useRef, type ElementType, type ReactNode } from 'react';
import { gsap } from '@/lib/gsap';
import { useMotionEffect } from '@/motion/useMotionEffect';
import { EASE, SCRUB } from '@/motion/config';
import { cn } from '@/lib/utils';

/**
 * VAPR SIGNATURE MOTION 3 — the chapter transition.
 *
 * The site had three signatures and needed a fourth. Text was uncovered by a
 * mask, images by a clip, and a property changed by a wipe — but chapters
 * simply ended. One section's last pixel sat directly above the next
 * section's first, and the join was a butt join: nothing was moving at the
 * moment the subject changed, so the page read as a stack of slides rather
 * than as one continuous take.
 *
 * This is the join. As a chapter leaves through the top of the frame its
 * content drifts up and dims, so it is still moving when the next chapter
 * arrives underneath it — the two overlap, and the cut is hidden inside the
 * movement. It is the same idea the hero already used on its own departure
 * (§19); this makes it the rule rather than one section's private trick.
 *
 * ── Why it is deliberately almost invisible ──────────────────────────────
 * The whole travel is 5% of the section's height and the floor is 30%
 * opacity, spread across the last half-viewport of the chapter's life. Run
 * larger, it becomes a transition the visitor watches; run at this size it is
 * only felt, which is the difference between film grammar and a slideshow.
 *
 * Scrubbed, so scrolling back up runs it backwards — the departure is the
 * visitor's to control, like everything else on the page.
 */

export type ChapterProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  /**
   * Travel on departure, as a percentage of the section's own height.
   * Kept below 6: past that the type visibly slides out from under itself.
   */
  lift?: number;
  /** How far the chapter dims as it goes. 1 keeps it lit. */
  fadeTo?: number;
  /**
   * The ground the chapter dims *into*.
   *
   * The departure is an opacity fade, so whatever is behind the chapter is
   * what a departing chapter reveals — and behind every chapter is the page,
   * which is paper. On a paper chapter that is invisible. On an ink one it
   * was a wash of near-white climbing the frame as the section left: measured
   * at the top of the viewport, a row averaging 250 while the chapter sat at
   * 0.3.
   *
   * Painting the ground on the wrapper rather than the page gives the fade
   * its own colour to dim into. The wrapper does not move and does not fade —
   * only the inner does — so an ink chapter now dims into ink.
   */
  ground?: 'paper' | 'ink';
  /**
   * Skip the departure. For chapters whose own timeline already owns the exit
   * — a pinned scene that fades its contents out on its last beat would fight
   * this, and two systems animating one opacity is how flicker happens.
   */
  hold?: boolean;
};

export default function Chapter({
  children,
  as = 'section',
  className,
  lift = 5,
  fadeTo = 0.3,
  ground,
  hold = false,
  ...rest
}: ChapterProps) {
  const root = useRef<HTMLElement>(null);

  useMotionEffect(
    root,
    ({ q }) => {
      const el = root.current;
      if (!el || hold) return;

      // The inner wrapper moves, never the section itself: the section is
      // what ScrollTrigger measures against, and transforming your own
      // trigger makes the start and end positions chase each other.
      const inner = q('[data-chapter-inner]')[0];
      if (!inner) return;

      gsap.fromTo(
        inner,
        { yPercent: 0, opacity: 1 },
        {
          yPercent: -lift,
          opacity: fadeTo,
          ease: EASE.none,
          scrollTrigger: {
            trigger: el,
            // Begins only once the chapter is genuinely on its way out — the
            // last half-viewport of it — so nothing dims while it is still
            // being read.
            start: 'bottom 90%',
            end: 'bottom top',
            scrub: SCRUB.weighted,
            invalidateOnRefresh: true,
          },
        }
      );
    },
    [lift, fadeTo, hold]
  );

  const Tag = as as 'section';
  const ref = root as React.RefObject<HTMLElement | null>;

  return (
    <Tag
      ref={ref as never}
      className={cn(
        ground === 'ink' && 'on-ink bg-paper',
        ground === 'paper' && 'bg-paper',
        className
      )}
      data-chapter
      {...rest}
    >
      <div data-chapter-inner>{children}</div>
    </Tag>
  );
}
