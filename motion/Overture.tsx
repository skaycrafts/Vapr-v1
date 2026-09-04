'use client';

import { useRef, useState } from 'react';
import Emblem from '@/components/brand/Emblem';
import { gsap, useIsoLayoutEffect } from '@/lib/gsap';
import { useCapability } from '@/motion/capability';
import { useScroll } from '@/motion/ScrollProvider';
import { ENTRY, useEntry } from '@/motion/entry';
import { EASE } from '@/motion/config';

/**
 * The first two seconds.
 *
 * A restrained black field carrying the seal, which draws itself and then
 * lifts off the top of the frame to hand over to the hero. There is no
 * spinner and no percentage counter: the page is not loading, it is arriving.
 * A counter would also be a lie — it counted an animation, not any real work.
 *
 * It is an overlay, not a gate. The hero is fully rendered underneath the
 * entire time, so a crawler, a reader with scripting off, or a failed
 * animation all still get the site. Reduced motion collapses it to a short
 * fade, and the whole thing is skipped on the first pointer or key press —
 * a visitor who wants to get on with it always can.
 */
export default function Overture() {
  const root = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const [gone, setGone] = useState(false);
  const { animate, ready } = useCapability();
  const { begin, finish } = useEntry();
  const { stop, start } = useScroll();

  useIsoLayoutEffect(() => {
    const el = root.current;
    // Wait for the capability read: building the timeline before we know
    // whether motion is welcome means one frame of the wrong sequence.
    if (!el || !ready || started.current) return;
    started.current = true;

    // Hold the page at the top for the duration. The sequence is short enough
    // that this is never felt as a lock.
    stop();
    window.scrollTo(0, 0);

    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      setGone(true);
      finish();
      start();
    };

    /**
     * The safety net, and it is not theoretical.
     *
     * Everything below hands the job of removing this overlay to the GSAP
     * ticker — and the ticker is driven by `requestAnimationFrame`, which the
     * browser does not run in a background tab. Whatever happens to the
     * animation, the page must end up usable, so this fires regardless.
     *
     * Armed only once the tab is actually being looked at (see below), or it
     * would spend its whole budget while the page sits unwatched.
     */
    let failsafe = 0;
    const arm = (ms: number) => {
      window.clearTimeout(failsafe);
      failsafe = window.setTimeout(release, ms);
    };

    // Timers created by the branches below, cleared on unmount.
    const timers: number[] = [];

    const ctx = gsap.context(() => {
      // Reduced motion: no draw, no lift, and no dependency on the ticker
      // either — a plain timer, so the overlay clears even if the tab was
      // never looked at.
      if (!animate) {
        begin();
        el.style.transition = 'opacity 300ms linear';
        el.style.opacity = '0';
        timers.push(window.setTimeout(release, 320));
        return;
      }

      // Geometry only. `.emblem-line *` also matches the <g> wrappers, which
      // draw nothing but still consume stagger slots.
      const strokes = gsap.utils.toArray<SVGGeometryElement>(
        '.emblem-line path, .emblem-line circle, .emblem-line line'
      );

      // Seed each path's dash from its own length so they draw at a
      // comparable rate rather than snapping in together.
      strokes.forEach((node) => {
        const len = typeof node.getTotalLength === 'function' ? node.getTotalLength() : 0;
        if (!len) return;
        gsap.set(node, { strokeDasharray: len, strokeDashoffset: len });
      });

      // Held until the tab is actually being looked at. The first two seconds
      // are the point of this sequence, and spending them on a tab opened in
      // the background — then showing a static page when the visitor finally
      // arrives — wastes the only chance the site gets to make an entrance.
      const tl = gsap.timeline({ onComplete: release, paused: document.hidden });

      tl
        // The seal draws. Fast enough to be a gesture, not a performance.
        .to(
          strokes,
          {
            strokeDashoffset: 0,
            duration: 0.85,
            stagger: { each: 0.005, from: 'center' },
            ease: EASE.outSoft,
          },
          0
        )
        // …and the name resolves inside it. A fade, not a rise: the wordmark
        // sits within the seal now rather than under it, so there is no mask
        // for it to climb out of — and the mark is the one thing on this site
        // that is never allowed to perform.
        .from('.emblem-word', { opacity: 0, duration: 0.6, ease: EASE.outSoft }, ENTRY.mark)
        // The lockup releases, and the field lifts away. `begin()` fires here
        // rather than at the end: the hero's own timeline starts while this
        // is still moving, so the two overlap instead of queueing.
        .add(begin, ENTRY.lift)
        .to(
          '.overture-lockup',
          { autoAlpha: 0, duration: 0.5, ease: EASE.outSoft },
          ENTRY.lift
        )
        .to(
          el,
          { yPercent: -100, duration: 1.1, ease: EASE.inOutHeavy },
          ENTRY.lift + 0.1
        );

      // Let an impatient visitor out. Seeking to the end runs every callback
      // in order, so the page lands in exactly the state it would have.
      const skip = () => tl.progress(1);
      window.addEventListener('pointerdown', skip, { once: true });
      window.addEventListener('keydown', skip, { once: true });

      // Start the clock the moment the tab is looked at — now, if it already
      // is.
      const onVisible = () => {
        if (document.hidden) return;
        document.removeEventListener('visibilitychange', onVisible);
        tl.play();
        arm(6000);
      };

      if (document.hidden) {
        document.addEventListener('visibilitychange', onVisible);
        // Waiting for a `visibilitychange` that never comes is a real failure
        // mode, not a hypothetical one: some embedded and prerendered contexts
        // report hidden for the whole life of the page. Hold the entrance for
        // a visitor who arrives soon, but never hold the site hostage to it.
        arm(20000);
      } else {
        arm(6000);
      }

      return () => {
        document.removeEventListener('visibilitychange', onVisible);
        window.removeEventListener('pointerdown', skip);
        window.removeEventListener('keydown', skip);
      };
    }, el);

    return () => {
      window.clearTimeout(failsafe);
      timers.forEach(window.clearTimeout);
      ctx.revert();
      // Never leave the page unscrollable because the sequence was
      // interrupted by a hot reload or an unmount mid-flight.
      start();
    };
  }, [ready, animate]);

  if (gone) return null;

  return (
    <div
      ref={root}
      data-overture
      className="fixed inset-0 z-[var(--z-preloader)] flex items-center justify-center bg-void"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      {/*
        The whole logo, and nothing beside it.

        This used to be a lockup we assembled: the seal with its wordmark
        removed, and VAPR set again underneath in tracked-out display type.
        That is a perfectly good arrangement of two things — but the mark
        already contains its own name, so the page opened by showing the word
        twice and the actual logo never once.
      */}
      <div className="overture-lockup flex flex-col items-center">
        <Emblem animated variant="full" className="overture-mark w-[min(46vw,17rem)] text-chalk" />
      </div>
    </div>
  );
}
