'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import Frame from '@/components/media/Frame';
import RevealText from '@/motion/primitives/RevealText';
import { LOCATIONS, LOCATIONS_INTRO, SITE, placeOf, type Location } from '@/lib/content';
import { gsap } from '@/lib/gsap';
import { useCapability } from '@/motion/capability';
import { useMotionEffect } from '@/motion/useMotionEffect';
import { CINEMA, EASE, STAGGER } from '@/motion/config';
import type { ImageSlug } from '@/lib/media';

/**
 * VAPR SIGNATURE MOTION 4 — a property changing.
 *
 * The first thing under the hero, because "which one?" is the first question
 * a two-property group has to answer. This is the interaction the site is
 * judged on, so it gets the most attention of anything here.
 *
 * ── What this replaced, and why ──────────────────────────────────────────
 * It used to be a row of tabs above a 7/5 grid: photograph left, facts right,
 * both properties the same size, in boxes. That is a comparison table with a
 * nice transition on it. It answers "what are the differences" — but the
 * question a guest is actually asking is "where am I staying", and a table
 * cannot answer that, because a table has no place in it.
 *
 * So neither property is a card any more. The chosen one owns the frame: its
 * photograph runs full-bleed across the top of the stage, with the place name
 * set into its foot at the largest size on the page outside the hero. The
 * other one is not hidden and not shrunk into a thumbnail — it stands at the
 * right edge as a tall sliver of its own photograph, lit low, the way the
 * next room along a corridor is visible without being where you are.
 *
 * The asymmetry is the argument. Two equal columns say "here are two
 * options". One dominant frame with a second entering at the edge says "you
 * are in Ashok Nagar, and Guindy is over there" — which is what the hotel is.
 *
 * ── Why the facts sit under the photograph, not on it ────────────────────
 * The first build of this put the whole block — name, sentence, both numbers,
 * the link — over the image. Measured against the ground actually behind each
 * line, almost all of it failed: the sentence came in at 1.0:1 and the two
 * statistics at 1.3:1, which is not "a little low", it is invisible.
 * `facade-street` is a bright daylight photograph, yellow render under a blue
 * sky, and no scrim rescues a 300px copy block on that without grading the
 * photograph into mud.
 *
 * The fix is compositional rather than technical, and it is what an
 * architecture magazine does with a plate: the name goes into the foot of the
 * image, where it is large enough to hold its own and a heavy bottom scrim
 * can carry it; everything a guest actually has to *read* sits underneath on
 * black, where it is simply legible. The photograph keeps its light, the
 * asymmetry is untouched, and nothing has to be squinted at.
 *
 * ── The transition ───────────────────────────────────────────────────────
 * One master timeline, ~1.1s, and the layers are deliberately not
 * synchronised: the outgoing frame is still drifting when the incoming one
 * has already begun wiping across it, and the type changes on its own clock
 * after both. Everything moving together is a slide; things moving at
 * different rates is a place.
 *
 * ── Accessibility ────────────────────────────────────────────────────────
 * This is deliberately NOT a tablist. A tabs pattern needs every tab present
 * and focusable, and this design shows one control — the property you are not
 * in. Keeping the tablist would have meant a tab that is `display: none`,
 * which is removed from the accessibility tree entirely: the roving tabindex
 * would have parked the only keyboard stop on an invisible element, and the
 * group would have reported one tab out of two.
 *
 * So it is what it looks like: a single button that changes the frame, named
 * for what it does. The change is announced through a small live region
 * carrying the property name alone — not the panel, which would re-read four
 * paragraphs every time. The destination stays an ordinary link that works
 * with or without any of it.
 */
export default function Locations() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const previous = useRef(0);
  const { animate } = useCapability();

  /**
   * Which panel React is allowed to hide.
   *
   * The two systems must not both own opacity. When motion is on, GSAP owns
   * it from the first swap onward, so React must keep emitting the
   * *mount-time* state forever — otherwise a re-render would slam the
   * outgoing panel to hidden and destroy the overlap the whole transition
   * depends on. Without motion there is no timeline, so React owns it and the
   * swap is instant, which is what reduced motion should get.
   */
  const [mountedWith] = useState(active);
  const hiddenIndex = animate ? mountedWith : active;

  const location = LOCATIONS[active];
  const other = LOCATIONS[(active + 1) % LOCATIONS.length];

  /** The lede arrives normally — this part is a page, not a scene. */
  useMotionEffect(root, () => {
    gsap.from('.loc-copy [data-lede]', {
      y: 20,
      opacity: 0,
      duration: CINEMA.fast,
      ease: EASE.outLong,
      stagger: STAGGER.items,
      scrollTrigger: { trigger: '.loc-copy', start: 'top 80%', once: true },
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

      // The incoming panel is stacked above the outgoing one for the
      // duration, then the outgoing one is parked so it cannot catch pointer
      // events or reach a screen reader.
      gsap.set(entering, { autoAlpha: 1, zIndex: 2 });
      gsap.set(leaving, { zIndex: 1 });

      const tl = gsap.timeline({
        defaults: { ease: EASE.inOutHeavy },
        onComplete: () => gsap.set(leaving, { autoAlpha: 0 }),
      });

      // ~1.15s end to end. Long enough to read as a place changing, short
      // enough that a guest comparing the two can flip back and forth
      // without ever waiting on it.
      const WIPE = 0.9;
      const SETTLE = 1.15;

      // The photographs cross and the type cuts — the same rule the shared
      // rooms sequence follows, and for the same reason. The first build of
      // this animated only the incoming panel, so for half a second Guindy's
      // sentence was printed directly on top of Ashok Nagar's and neither was
      // readable. An image dissolving through an image is a dissolve; a
      // paragraph dissolving through a paragraph is a smear.
      const leavingName = leaving.querySelectorAll('[data-swap] > *');
      const leavingRest = leaving.querySelectorAll('[data-fade]');
      const enteringName = entering.querySelectorAll('[data-swap] > *');
      const enteringRest = entering.querySelectorAll('[data-fade]');

      const HANDOFF = 0.3;

      tl
        // ── The frame. These genuinely overlap. ────────────────────────────
        // The incoming photograph is uncovered from the right edge — the side
        // the other property was standing on, so the movement follows the
        // direction the eye has already gone.
        .fromTo(
          enteringPlate,
          { clipPath: 'inset(0% 0% 0% 100%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: WIPE },
          0
        )
        // …and settles out of an over-scale as it arrives, so the frame is
        // moving *with* the wipe rather than being uncovered while frozen.
        .fromTo(
          enteringPlate?.querySelector('img') ?? [],
          { scale: 1.14 },
          { scale: 1, duration: SETTLE, ease: EASE.outLong },
          0
        )
        // The outgoing frame keeps moving underneath. It never blinks out.
        .to(leavingPlate, { scale: 1.05, opacity: 0.3, duration: WIPE }, 0)

        // ── The type. This does not overlap. ──────────────────────────────
        // Out first: the name up through the top of its own mask, everything
        // else simply away. Both are finished by HANDOFF.
        .to(leavingName, { yPercent: -130, duration: HANDOFF, ease: EASE.inOut }, 0)
        .to(leavingRest, { opacity: 0, y: -10, duration: HANDOFF * 0.8, ease: EASE.out }, 0)

        // In second, starting on the beat the outgoing type clears.
        .fromTo(
          enteringName,
          { yPercent: 130 },
          { yPercent: 0, duration: 0.7, ease: EASE.outLong, stagger: STAGGER.lines },
          HANDOFF
        )
        .fromTo(
          enteringRest,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.55, ease: EASE.out, stagger: STAGGER.items },
          HANDOFF + 0.1
        );
    },
    [active]
  );

  /** One control, one job: show the property you are not looking at. */
  const showOther = useCallback(() => {
    setActive((current) => (current + 1) % LOCATIONS.length);
  }, []);

  return (
    <section
      ref={root}
      id="locations"
      aria-labelledby="locations-title"
      className="relative bg-void"
    >
      <div className="gutter pt-20 md:pt-28">
        <div className="loc-copy grid gap-10 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-6">
            <p data-lede className="type-label">
              {LOCATIONS_INTRO.eyebrow}
            </p>
            <RevealText
              as="h2"
              id="locations-title"
              mode="lines"
              className="type-display mt-4 text-[clamp(2.25rem,5vw,4rem)] text-chalk"
            >
              {LOCATIONS_INTRO.title}
            </RevealText>
          </div>

          <div className="space-y-5 md:col-span-5 md:col-start-8 md:pt-3">
            {LOCATIONS_INTRO.body.map((para) => (
              <p key={para} data-lede className="max-w-[46ch] text-lg leading-relaxed text-mist">
                {para}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* The name alone, for anyone who cannot see the frame change. */}
      <p aria-live="polite" className="sr-only-focusable">
        Now showing {location.name}, {placeOf(location)}.
      </p>

      {/*
        The stage. Both panels are always in the DOM so the outgoing one can
        keep moving under the incoming one; only the active one is exposed to
        assistive technology. The fixed height is what lets them stack.
      */}
      <div className="loc-stage relative mt-12 h-[80svh] min-h-[34rem] md:mt-16 md:h-[88svh]">
        {LOCATIONS.map((loc, i) => (
          <div
            key={loc.slug}
            data-panel={i}
            aria-hidden={active !== i}
            className="absolute inset-0 flex flex-col"
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
            {/* ── The photograph, with the name set into its foot. ───────── */}
            <div className="relative min-h-0 flex-1 md:mr-[16%]">
              <div data-plate className="absolute inset-0 overflow-hidden">
                <Frame
                  slug={(loc.panelImage ?? loc.heroImage) as ImageSlug}
                  sizes="(min-width: 768px) 84vw, 100vw"
                  ratio="fill"
                  className="h-full w-full"
                  position="50% 46%"
                />
              </div>

              {/*
                Title-safe. The name is the only thing on the photograph, and
                measured against the render behind it a lighter gradient left
                it at 1.37:1 — the classic mistake of trusting that white on a
                picture is "obviously" readable. The heavy band starts at 64%
                and lands on solid void at the foot, which is enough for a
                104px Didone and leaves the top two-thirds of the frame at
                full light.
              */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to bottom, color-mix(in oklab, var(--color-void) 46%, transparent) 0%, transparent 22%, transparent 42%, color-mix(in oklab, var(--color-void) 58%, transparent) 64%, color-mix(in oklab, var(--color-void) 90%, transparent) 82%, var(--color-void) 100%)',
                }}
              />

              <div className="gutter absolute inset-x-0 bottom-0 pb-5 md:pb-7">
                <div data-swap className="split-mask">
                  <span className="type-display block text-[clamp(2.75rem,7.5vw,6.5rem)] leading-[0.95] text-chalk">
                    {loc.shortName}
                  </span>
                </div>
              </div>
            </div>

            {/* ── What a guest actually has to read, on black. ───────────── */}
            <div className="gutter shrink-0 pt-6 md:mr-[16%] md:pt-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-12">
                <div>
                  <p data-fade className="type-label">
                    {placeOf(loc)}
                  </p>
                  <p data-fade className="mt-3 max-w-[42ch] text-lg leading-relaxed text-mist">
                    {loc.blurb}
                  </p>
                  {loc.imagesArePlaceholder ? (
                    <p data-fade className="mt-3 max-w-[44ch] text-xs text-smoke">
                      {loc.shortName} is still being photographed. The frames here are
                      from Ashok Nagar, finished to the same standard.
                    </p>
                  ) : null}
                </div>

                {/* The two numbers that actually separate the properties, set
                    as data rather than buried in a sentence. */}
                <dl data-fade className="flex shrink-0 items-end gap-x-10 md:gap-x-12">
                  <div>
                    <dt className="type-label">Rooms</dt>
                    <dd className="tabular type-display mt-1 text-3xl leading-none text-chalk md:text-4xl">
                      {loc.roomCount}
                    </dd>
                  </div>
                  <div>
                    <dt className="type-label">Guest rating</dt>
                    <dd className="tabular type-display mt-1 text-3xl leading-none text-chalk md:text-4xl">
                      {loc.rating.score.toFixed(1)}
                      <span className="type-wide ml-1.5 text-sm text-smoke">
                        / 5 · {loc.rating.count} guests
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>

              {/* §21 — the arrow moves, the label shifts a couple of pixels,
                  and the rule fills. No bounce, no glow, no scale. */}
              <Link
                data-fade
                href={`/${loc.slug}`}
                data-cursor="Explore"
                className="group relative mt-6 inline-flex items-center gap-3 overflow-hidden pb-2 text-chalk md:mt-8"
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
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-hairline-strong" />
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-chalk transition-transform duration-700 ease-[var(--ease-out-quart)] group-hover:scale-x-100"
                />
              </Link>
            </div>
          </div>
        ))}

        {/*
          The other property, standing at the edge of the frame.

          One button, because there is one thing to do. On a wide screen it is
          a tall sliver of that property's own photograph down the right edge
          of the stage. On a phone there is no room beside a full-bleed frame,
          so it leaves the stage and becomes a band underneath — which reads in
          the right order anyway: here is Ashok Nagar, and also, Guindy.
        */}
        <button
          type="button"
          onClick={showOther}
          data-cursor="Explore"
          className="group absolute inset-y-0 right-0 z-10 hidden w-[16%] overflow-hidden text-left md:block"
        >
          <span className="sr-only-focusable">Show {other.name}</span>
          <SwitchFace location={other} />
          <span aria-hidden className="absolute inset-y-0 left-0 w-px bg-hairline-strong" />
        </button>
      </div>

      {/* The same control, in the shape a thumb wants. */}
      <button
        type="button"
        onClick={showOther}
        className="group relative block h-24 w-full overflow-hidden text-left md:hidden"
      >
        <span className="sr-only-focusable">Show {other.name}</span>
        <SwitchFace location={other} />
        <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-hairline-strong" />
      </button>

      <p className="gutter mt-10 max-w-[62ch] text-sm text-smoke">
        Both are in {SITE.city}, and whichever you choose the enquiry reaches the same
        people. Ratings are as recorded on Treebo, where both hotels are listed.
      </p>
    </section>
  );
}

/**
 * The face of the "other property" control, shared by the desktop sliver and
 * the mobile band — one control in two shapes, so the two can never drift
 * apart. The photograph is held low and lifts on hover; the tint is what
 * keeps the three lines of type on it legible at either size.
 */
function SwitchFace({ location }: { location: Location }) {
  return (
    <>
      <span aria-hidden className="absolute inset-0">
        <Frame
          slug={(location.panelImage ?? location.heroImage) as ImageSlug}
          sizes="(min-width: 768px) 18vw, 100vw"
          ratio="fill"
          className="h-full w-full"
          imgClassName="opacity-50 transition-opacity duration-700 ease-[var(--ease-out-quart)] group-hover:opacity-75"
          position="50% 46%"
        />
      </span>
      <span
        aria-hidden
        className="absolute inset-0 bg-void/60 transition-colors duration-700 ease-[var(--ease-out-quart)] group-hover:bg-void/45"
      />
      <span
        aria-hidden
        className="relative flex h-full items-center justify-between gap-4 px-5 md:flex-col md:items-start md:justify-end md:px-6 md:pb-8"
      >
        <span className="type-label text-smoke">Also</span>
        <span className="type-display text-xl leading-tight text-chalk md:mt-2 md:text-2xl">
          {location.shortName}
        </span>
        <span className="tabular type-label md:mt-1">{location.roomCount} rooms</span>
      </span>
    </>
  );
}
