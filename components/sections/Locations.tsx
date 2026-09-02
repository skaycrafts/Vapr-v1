'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import Frame from '@/components/media/Frame';
import { LOCATIONS, LOCATIONS_INTRO, SITE, placeOf } from '@/lib/content';
import { gsap } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import { useCapability } from '@/motion/capability';
import { useMotionEffect } from '@/motion/useMotionEffect';
import { CINEMA, EASE, STAGGER } from '@/motion/config';
import type { ImageSlug } from '@/lib/media';

/**
 * The first thing under the hero, because "which one?" is the first question
 * a two-property group has to answer.
 *
 * Not two cards side by side. One property occupies the frame at a time, and
 * changing between them is a cut in a film rather than a tab in a widget: the
 * outgoing photograph is still on screen, drifting and dimming, while the
 * incoming one wipes in over the top of it. Nothing ever goes blank between
 * the two, which is the whole difference between a chapter change and a
 * carousel (§09).
 *
 * Accessibility comes first here, because this is a real choice and not a
 * decoration. The two controls are buttons in a tablist, driven by arrow keys
 * as well as clicks; the panel they control is a live region; and the actual
 * destination is an ordinary link that works with or without any of the above.
 */
export default function Locations() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const previous = useRef(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const { animate } = useCapability();

  /**
   * Which panel React is allowed to hide.
   *
   * The two systems must not both own opacity. When motion is on, GSAP owns it
   * from the first swap onward, so React must keep emitting the *mount-time*
   * state forever — otherwise a re-render would slam the outgoing panel to
   * hidden and destroy the overlap the whole transition depends on. When
   * motion is off there is no timeline, so React owns it and the swap is
   * instant, which is exactly what reduced motion should get.
   */
  const [mountedWith] = useState(active);
  const hiddenIndex = animate ? mountedWith : active;

  const location = LOCATIONS[active];

  /** The intro copy arrives normally — this part is a page, not a scene. */
  useMotionEffect(root, () => {
    gsap.from('.loc-copy > *', {
      y: 20,
      opacity: 0,
      duration: CINEMA.fast,
      ease: EASE.outLong,
      stagger: STAGGER.items,
      scrollTrigger: { trigger: '.loc-copy', start: 'top 80%', once: true },
    });

    gsap.from('.loc-stage', {
      opacity: 0,
      duration: CINEMA.base,
      ease: EASE.out,
      scrollTrigger: { trigger: '.loc-stage', start: 'top 85%', once: true },
    });
  });

  /**
   * The change itself. Runs on every `active` change after the first paint,
   * reading `previous` to know which layer is leaving.
   */
  useMotionEffect(
    root,
    ({ q }) => {
      const from = previous.current;
      previous.current = active;
      if (from === active) return;

      const leaving = q(`[data-panel="${from}"]`)[0];
      const entering = q(`[data-panel="${active}"]`)[0];
      if (!leaving || !entering) return;

      const leavingPlate = leaving.querySelector<HTMLElement>('[data-plate]');
      const enteringPlate = entering.querySelector<HTMLElement>('[data-plate]');

      // The incoming panel is stacked above the outgoing one for the duration,
      // then the outgoing one is parked so it cannot catch pointer events.
      gsap.set(entering, { autoAlpha: 1, zIndex: 2 });
      gsap.set(leaving, { zIndex: 1 });

      const tl = gsap.timeline({
        defaults: { ease: EASE.inOutHeavy },
        onComplete: () => {
          gsap.set(leaving, { autoAlpha: 0 });
        },
      });

      // The whole change lands inside ~1.2s. Long enough to read as a chapter
      // turning, short enough that a visitor comparing the two properties can
      // flip back and forth without waiting on it.
      const WIPE = 0.9;
      const SETTLE = 1.2;

      tl
        // The photograph wipes in from the right edge. One of the four
        // signature reveals, used here because the movement between two
        // properties is lateral.
        .fromTo(
          enteringPlate,
          { clipPath: 'inset(0% 0% 0% 100%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: WIPE },
          0
        )
        // …and settles out of an over-scale as it arrives, so the frame is
        // moving with the wipe rather than being uncovered while frozen.
        .fromTo(
          enteringPlate?.querySelector('img') ?? [],
          { scale: 1.12 },
          { scale: 1, duration: SETTLE, ease: EASE.outLong },
          0
        )
        // The outgoing frame keeps moving underneath. It never blinks out.
        .to(leavingPlate, { scale: 1.04, opacity: 0.35, duration: WIPE }, 0)
        // Type changes over: out through the top of its mask, in from below.
        .fromTo(
          entering.querySelectorAll('[data-swap] > *'),
          { yPercent: 110 },
          { yPercent: 0, duration: 0.75, ease: EASE.outLong, stagger: STAGGER.lines },
          0.1
        )
        .fromTo(
          entering.querySelectorAll('[data-fade]'),
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.6, ease: EASE.out, stagger: STAGGER.items },
          0.18
        );
    },
    [active]
  );

  /** Arrow keys move between the two, as a tablist is expected to. */
  const onTabKey = useCallback((event: React.KeyboardEvent) => {
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
    const back = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
    if (!forward && !back) return;

    event.preventDefault();
    setActive((current) => {
      const next = (current + (forward ? 1 : -1) + LOCATIONS.length) % LOCATIONS.length;
      // Roving focus: the newly selected tab is the one that holds it.
      requestAnimationFrame(() => tabs.current[next]?.focus());
      return next;
    });
  }, []);

  return (
    <section
      ref={root}
      id="locations"
      aria-labelledby="locations-title"
      className="relative bg-void py-20 md:py-28"
    >
      <div className="gutter">
        <div className="loc-copy grid gap-10 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-5">
            <p className="type-label">{LOCATIONS_INTRO.eyebrow}</p>
            <h2
              id="locations-title"
              className="type-display mt-4 text-[clamp(2.25rem,5vw,4rem)] text-chalk"
            >
              {LOCATIONS_INTRO.title}
            </h2>
          </div>

          <div className="space-y-5 md:col-span-6 md:col-start-7 md:pt-3">
            {LOCATIONS_INTRO.body.map((para) => (
              <p key={para} className="max-w-[52ch] text-lg leading-relaxed text-mist">
                {para}
              </p>
            ))}
          </div>
        </div>

        {/* The selector. */}
        <div
          role="tablist"
          aria-label="Choose a property"
          className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-hairline pb-5 md:mt-20"
        >
          {LOCATIONS.map((loc, i) => (
            <button
              key={loc.slug}
              ref={(node) => {
                tabs.current[i] = node;
              }}
              type="button"
              role="tab"
              id={`loc-tab-${loc.slug}`}
              aria-selected={active === i}
              aria-controls="loc-panel"
              // Roving tabindex: one stop for the whole group, then arrows.
              tabIndex={active === i ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={onTabKey}
              data-cursor="Explore"
              className={cn(
                'type-display relative text-[clamp(1.5rem,3.4vw,2.5rem)] leading-none transition-colors duration-500',
                active === i ? 'text-chalk' : 'text-graphite hover:text-mist'
              )}
            >
              {loc.shortName}
              <span
                aria-hidden
                className={cn(
                  'absolute -bottom-5 left-0 h-px w-full origin-left bg-chalk transition-transform duration-700 ease-[var(--ease-out-quart)]',
                  active === i ? 'scale-x-100' : 'scale-x-0'
                )}
              />
            </button>
          ))}

          <span className="tabular type-label ml-auto" aria-hidden>
            {String(active + 1).padStart(2, '0')} / {String(LOCATIONS.length).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* The stage. Both panels are always in the DOM so the outgoing one can
          keep moving under the incoming one; only the active one is exposed to
          assistive technology. */}
      <div
        id="loc-panel"
        role="tabpanel"
        aria-labelledby={`loc-tab-${location.slug}`}
        aria-live="polite"
        className="loc-stage relative mt-10 md:mt-14"
      >
        {LOCATIONS.map((loc, i) => (
          <div
            key={loc.slug}
            data-panel={i}
            aria-hidden={active !== i}
            // Panels after the first are stacked on top of the first, which is
            // the one that holds the section's height.
            className={cn(
              'gutter grid gap-8 md:grid-cols-12 md:items-end md:gap-10',
              i === 0 ? 'relative' : 'absolute inset-0'
            )}
            style={
              // Written inline rather than by script so the correct panel is
              // on top before any JavaScript runs. See `hiddenIndex` above for
              // why this deliberately stops tracking `active` once GSAP is
              // driving the change.
              i === hiddenIndex
                ? undefined
                : { opacity: 0, visibility: 'hidden', pointerEvents: 'none' }
            }
          >
            <div data-plate className="md:col-span-7">
              <Frame
                slug={loc.heroImage as ImageSlug}
                sizes="(min-width: 768px) 58vw, 100vw"
                ratio={16 / 10}
                className="w-full"
              />
            </div>

            <div className="md:col-span-5 md:pb-2">
              <p data-fade className="type-label">
                {placeOf(loc)}
              </p>

              {/* Each line rides in its own mask so the two names can cross
                  over each other rather than dissolving. */}
              <div data-swap className="split-mask mt-3">
                <span className="type-display block text-[clamp(2.5rem,6vw,4.5rem)] leading-none text-chalk">
                  {loc.shortName}
                </span>
              </div>

              <div data-swap className="split-mask mt-2">
                <span className="tabular type-wide block text-[clamp(1rem,2vw,1.35rem)] text-smoke">
                  {loc.roomCount} rooms
                </span>
              </div>

              <p data-fade className="mt-6 max-w-[38ch] text-mist">
                {loc.blurb}
              </p>

              <p data-fade className="tabular mt-5 text-sm text-smoke">
                {loc.rating.score.toFixed(1)}
                <span className="text-ash"> / 5</span>
                <span className="ml-1.5">from {loc.rating.count} guests</span>
              </p>

              {loc.imagesArePlaceholder ? (
                <p data-fade className="mt-4 max-w-[38ch] text-xs text-smoke">
                  {loc.shortName} is still being photographed. The frames here are from
                  Ashok Nagar, finished to the same standard.
                </p>
              ) : null}

              {/* §21 — the arrow moves, the label shifts a couple of pixels,
                  and the rule fills. No bounce, no glow, no scale. */}
              <Link
                data-fade
                href={`/${loc.slug}`}
                data-cursor="Explore"
                className="group relative mt-8 inline-flex items-center gap-3 overflow-hidden pb-2 text-chalk"
              >
                <span className="transition-transform duration-500 ease-[var(--ease-out-quart)] group-hover:translate-x-1">
                  Look inside {loc.shortName}
                </span>
                <ArrowUpRight
                  size={16}
                  strokeWidth={1.5}
                  aria-hidden
                  className="transition-transform duration-500 ease-[var(--ease-out-quart)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-px bg-hairline-strong"
                />
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-chalk transition-transform duration-700 ease-[var(--ease-out-quart)] group-hover:scale-x-100"
                />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <p className="gutter mt-10 max-w-[62ch] text-sm text-smoke">
        Both are in {SITE.city}, and whichever you choose the enquiry reaches the same
        people. Ratings are as recorded on Treebo, where both hotels are listed.
      </p>

    </section>
  );
}
