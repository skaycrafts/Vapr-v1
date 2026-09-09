'use client';

import { useRef, useState } from 'react';
import { SITE } from '@/lib/content';
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

    // Read once, outside the timeline: `onUpdate` runs on every frame of the
    // count and has no business doing a DOM query each time.
    const count = el.querySelector<HTMLElement>('.overture-count');
    const rule = el.querySelector<HTMLElement>('.overture-rule');
    const letters = Array.from(el.querySelectorAll<HTMLElement>('.overture-letter'));
    const shown = letters.map(() => false);
    const progress = { n: 1 };

    /**
     * V at 25, A at 50, P at 75, R at 100 — the word is spelled by the load.
     *
     * Driven from the counter's own `onUpdate` rather than scheduled beside it
     * on the timeline. Two parallel tracks would agree only for as long as
     * nothing disturbed them; reading the same value the number reads means a
     * letter cannot appear at 24 or 26, by construction.
     *
     * Every letter still owed is revealed on each pass, not just the one that
     * has this instant crossed. That is what makes the skip correct: a visitor
     * who presses a key seeks the timeline to its end, `onUpdate` fires once
     * at 100, and all four arrive together rather than three being silently
     * skipped and only R appearing.
     */
    const MILESTONES = [25, 50, 75, 100];
    const revealLetters = (value: number) => {
      letters.forEach((letter, i) => {
        if (shown[i] || value < MILESTONES[i]) return;
        shown[i] = true;
        gsap.fromTo(
          letter,
          { opacity: 0, yPercent: 32 },
          { opacity: 1, yPercent: 0, duration: 0.5, ease: EASE.outLong }
        );
      });
    };

    const ctx = gsap.context(() => {
      // Reduced motion: no draw, no lift, and no dependency on the ticker
      // either — a plain timer, so the overlay clears even if the tab was
      // never looked at.
      if (!animate) {
        // No count. A number ticking to a hundred is precisely the kind of
        // motion this preference exists to switch off — so the readout shows
        // its finished state and the overlay simply clears.
        if (count) count.textContent = '100';
        if (rule) rule.style.transform = 'scaleX(1)';
        letters.forEach((letter) => {
          letter.style.opacity = '1';
        });
        begin();
        el.style.transition = 'opacity 300ms linear';
        el.style.opacity = '0';
        timers.push(window.setTimeout(release, 320));
        return;
      }

      // Held until the tab is actually being looked at. The first two seconds
      // are the point of this sequence, and spending them on a tab opened in
      // the background — then showing a static page when the visitor finally
      // arrives — wastes the only chance the site gets to make an entrance.
      const tl = gsap.timeline({ onComplete: release, paused: document.hidden });

      tl
        /*
         * Nothing arrives on its own clock here any more.
         *
         * The emblem used to resolve out of a hair under full size and hold
         * the centre of the field. It has been taken out of the splash — the
         * mark still opens the site everywhere else, but the loading screen is
         * now only the three things that describe loading: a number, a rule,
         * and the word being spelled as it fills.
         */
        .from('.overture-meter, .overture-rule', { opacity: 0, duration: 0.5 }, ENTRY.mark)
        /*
         * One value, two readouts.
         *
         * `progress.n` runs 1 → 100 and its `onUpdate` writes both the number
         * and the rule's scale on the same frame, so they cannot drift — not
         * on a slow device, not when the tab is backgrounded mid-count, and
         * not when an impatient visitor presses a key and the timeline is
         * seeked straight to its end.
         *
         * `power1.inOut` rather than a linear ramp: a loader that runs at a
         * dead constant rate reads as a progress bar, and one that decelerates
         * into its last few numbers reads as something arriving. It is the
         * gentlest ease in the vocabulary — anything heavier and the count
         * visibly stalls in the nineties, which is the exact tell of a fake
         * loader.
         */
        .to(
          progress,
          {
            n: 100,
            duration: ENTRY.countFor,
            ease: 'power1.inOut',
            onUpdate: () => {
              const value = Math.round(progress.n);
              revealLetters(value);
              if (count && count.textContent !== String(value)) {
                count.textContent = String(value);
              }
              if (rule) rule.style.transform = `scaleX(${progress.n / 100})`;
            },
          },
          ENTRY.count
        )
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
      className="on-ink fixed inset-0 z-[var(--z-preloader)] flex items-center justify-center bg-paper"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      {/*
        The word, spelled by the load.

        The emblem used to hold this space. It is gone from the splash — and
        only from the splash; the mark still opens the navigation, the footer,
        Chennai's closing beat and the property pages. A loading screen that
        shows the finished identity before anything has loaded is announcing an
        arrival that has not happened. Four letters filling in as the number
        climbs says the same thing and means it.

        All four slots are rendered from the start and hidden with opacity, so
        the letters appear where they will finally sit. The alternative —
        rendering only what has been revealed — re-centres the group on every
        milestone, and a word that jumps sideways four times is the opposite of
        what was asked for.
      */}
      <div className="overture-lockup flex items-center justify-center" aria-hidden>
        {['V', 'A', 'P', 'R'].map((letter) => (
          <span
            key={letter}
            className="overture-letter type-display block text-[clamp(3.25rem,13vw,9rem)] leading-[0.9] tracking-[0.12em] text-ink"
            style={{ opacity: 0 }}
          >
            {letter}
          </span>
        ))}
      </div>

      {/*
        The count, and the rule it fills.

        Both are driven by one tweened value rather than by two tweens of the
        same duration — see the timeline above. Two tweens would be
        synchronised only for as long as nothing interrupted them; one value
        cannot drift from itself, including when an impatient visitor seeks
        the timeline to the end.

        The number is set in the display face, and `tabular`
        so the digits do not jostle as they run. It is hidden from assistive
        technology: the overlay already announces itself as loading, and a
        live region counting to a hundred is not information, it is noise.
      */}
      <div className="gutter absolute inset-x-0 bottom-0 pb-8 md:pb-12">
        <div className="overture-meter flex items-end justify-between gap-6">
          <span
            aria-hidden
            className="overture-count tabular type-display block text-[clamp(3rem,11vw,7rem)] leading-[0.85] text-ink"
          >
            1
          </span>
          <span aria-hidden className="type-label pb-2">
            {SITE.city}
          </span>
        </div>

        <span aria-hidden className="mt-5 block h-px w-full bg-hairline md:mt-7">
          {/* Not `scale-x-0`: Tailwind v4 compiles that to the standalone
              `scale` property, which multiplies against the `transform` GSAP
              writes on every frame of the count — the fill measured 0px wide
              for the whole sequence while the number ran perfectly. The rest
              state is set on the property that is actually animated. */}
          <span
            className="overture-rule block h-px w-full origin-left bg-ink"
            style={{ transform: 'scaleX(0)' }}
          />
        </span>
      </div>
    </div>
  );
}
