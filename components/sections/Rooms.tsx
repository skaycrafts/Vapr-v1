'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import Frame from '@/components/media/Frame';
import Emblem from '@/components/brand/Emblem';
import RevealText from '@/motion/primitives/RevealText';
import { LOCATIONS, STAY } from '@/lib/content';
import { gsap } from '@/lib/gsap';
import { useMotionEffect, refreshScrollTriggers } from '@/motion/useMotionEffect';
import { EASE, SCRUB } from '@/motion/config';
import { cn } from '@/lib/utils';
import type { ImageSlug } from '@/lib/media';

/**
 * One room category per property, moved through sideways.
 *
 * The section pins and the track translates, so vertical scroll reads as
 * moving between the two rooms — on a phone as much as on a desktop. The
 * panels are proportioned differently at each size (a phone gets one panel
 * nearly full-bleed with the photograph above the specification; a wide screen
 * gets them side by side) but the mechanism is the same, so the site does not
 * have two different ideas about what this section is.
 *
 * ── On the two layouts ──────────────────────────────────────────────────
 * The horizontal track only exists when the scene is actually running.
 * `data-scene` is set by the motion effect, which runs only when the device
 * has agreed to motion — so a visitor with scripting off, or one who asked for
 * reduced motion, gets an ordinary vertical column instead.
 *
 * That matters more than it looks: a horizontal track with no script to drive
 * it is not merely unanimated, it is unreachable. `overflow-x: clip` on the
 * body would silently swallow every panel past the first. This was already
 * true on desktop before the track moved to mobile.
 *
 * Guindy has not been photographed yet, so its panel carries a disclosure.
 * That state is designed rather than empty — it should not read as a failure.
 */
export default function Rooms() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useMotionEffect(root, () => {
    const el = root.current;
    const rail = track.current;
    if (!el || !rail) return;

    // Switches the column into the horizontal track. Set here rather than in
    // the markup so the layout cannot engage without the timeline that makes
    // it navigable.
    el.dataset.scene = 'on';

    // Measured in a function so a resize — or a phone's address bar sliding
    // away — recomputes it rather than pinning to a width since changed.
    const distance = () => rail.scrollWidth - window.innerWidth;

    const tween = gsap.to(rail, {
      x: () => -distance(),
      ease: EASE.none,
      scrollTrigger: {
        trigger: el,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: SCRUB.weighted,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    // Parallax inside a horizontal track: `containerAnimation` tells
    // ScrollTrigger to measure against the track's travel rather than the
    // page's, which is the only way this reads correctly.
    gsap.utils.toArray<HTMLElement>('.room-plate').forEach((plate) => {
      const img = plate.querySelector('img');
      if (!img) return;
      gsap.fromTo(
        img,
        { xPercent: -7 },
        {
          xPercent: 7,
          ease: EASE.none,
          scrollTrigger: {
            trigger: plate,
            containerAnimation: tween,
            start: 'left right',
            end: 'right left',
            scrub: SCRUB.tight,
          },
        }
      );
    });

    // The track's width depends on imagery that may still be decoding.
    refreshScrollTriggers();

    return () => {
      delete el.dataset.scene;
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  });

  return (
    // `overflow-hidden` below is load-bearing, not tidiness. The track is
    // wider than the screen by design, and on a phone an unclipped overflow
    // widens the layout viewport itself — `innerWidth` then reports the
    // track's own width, the travel computes to `scrollWidth - innerWidth`
    // = 0, and the gallery pins without ever moving.
    <section ref={root} id="rooms" className="group relative overflow-hidden bg-void">
      <div
        ref={track}
        className={cn(
          'flex flex-col',
          'group-data-[scene=on]:h-[100svh] group-data-[scene=on]:flex-row group-data-[scene=on]:flex-nowrap group-data-[scene=on]:will-change-transform'
        )}
      >
        <div
          className={cn(
            'room-intro gutter flex flex-col justify-end py-16',
            'group-data-[scene=on]:h-full group-data-[scene=on]:w-[82vw] group-data-[scene=on]:shrink-0 group-data-[scene=on]:justify-center group-data-[scene=on]:pb-10 group-data-[scene=on]:pt-24',
            'md:group-data-[scene=on]:w-[34vw] md:group-data-[scene=on]:py-0'
          )}
        >
          <p className="type-label">The rooms</p>
          <RevealText
            as="h2"
            mode="lines"
            className="type-display mt-4 text-[clamp(2.25rem,5vw,4rem)] text-chalk"
          >
            One room,
            <br />
            done properly.
          </RevealText>
          <p className="mt-6 max-w-[32ch] text-mist">
            Neither hotel makes you pick between five tiers of the same bed. There is one
            category at each, and this is what is in it.
          </p>
          <p className="tabular mt-8 text-sm text-smoke">
            Check in from {STAY.checkIn} · out by {STAY.checkOut}
          </p>
        </div>

        {LOCATIONS.map((loc, i) => (
          <article
            key={loc.slug}
            className={cn(
              'room-panel gutter flex flex-col gap-8 border-t border-hairline py-14',
              // `py-0` here was a desktop decision: on a wide screen the panel
              // is two short columns with room to spare, but on a phone it is
              // a photograph stacked on a specification and the two together
              // fill the stage — so there was nothing left for `justify-center`
              // to centre, and the frame ran up under the fixed navigation.
              'group-data-[scene=on]:h-full group-data-[scene=on]:w-[90vw] group-data-[scene=on]:shrink-0 group-data-[scene=on]:justify-center group-data-[scene=on]:gap-6 group-data-[scene=on]:border-l group-data-[scene=on]:border-t-0 group-data-[scene=on]:pb-10 group-data-[scene=on]:pt-24',
              'md:group-data-[scene=on]:w-[80vw] md:group-data-[scene=on]:items-center md:group-data-[scene=on]:gap-12 md:group-data-[scene=on]:py-0',
              // Alternating only where the panel is actually two columns.
              i % 2 === 0
                ? 'md:group-data-[scene=on]:flex-row'
                : 'md:group-data-[scene=on]:flex-row-reverse'
            )}
          >
            <div
              className={cn(
                'room-plate aspect-[4/3] w-full overflow-hidden',
                // On a phone the panel is one column, so the photograph takes a
                // fixed slice of the height and the specification gets the rest.
                'group-data-[scene=on]:aspect-auto group-data-[scene=on]:h-[32vh] group-data-[scene=on]:shrink-0',
                'md:group-data-[scene=on]:h-[62vh] md:group-data-[scene=on]:w-[54%]'
              )}
            >
              {loc.images.length ? (
                <Frame
                  slug={loc.images[0] as ImageSlug}
                  sizes="(min-width: 768px) 44vw, 90vw"
                  ratio="fill"
                  className="h-full w-full"
                  imgClassName="scale-[1.08]"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-6 border border-hairline bg-pitch p-8 text-center">
                  <Emblem variant="mark" className="w-24 text-graphite md:w-32" />
                  <p className="max-w-[28ch] text-sm text-smoke">
                    {loc.shortName} is still being photographed. The specification is
                    here, and the desk will send you pictures on request.
                  </p>
                </div>
              )}
            </div>

            <div
              data-room-copy
              className="min-w-0 md:group-data-[scene=on]:w-[46%]"
            >
              <div className="flex items-baseline gap-4">
                <span className="tabular type-label">{String(i + 1).padStart(2, '0')}</span>
                <span className="h-px flex-1 bg-hairline" />
                <span className="type-label">{loc.area}</span>
              </div>

              <h3 className="type-display mt-4 text-[clamp(2rem,4vw,3.25rem)] text-chalk md:mt-5">
                {loc.room.name}
              </h3>
              <p className="mt-2 text-mist">
                at {loc.name} · {loc.roomCount} rooms
              </p>
              {loc.imagesArePlaceholder ? (
                <p className="mt-2 text-xs text-smoke">
                  Photograph shows an Ashok Nagar room, finished to the same standard.
                </p>
              ) : null}

              <dl className="mt-5 md:mt-9">
                {[
                  { label: 'Bed', value: loc.room.bed },
                  { label: 'Sleeps', value: loc.room.sleeps },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between gap-6 border-t border-hairline py-2.5 md:py-3"
                  >
                    <dt className="type-label">{row.label}</dt>
                    <dd className="text-right text-sm text-bone">{row.value}</dd>
                  </div>
                ))}
                <div className="border-t border-hairline py-3">
                  <dt className="type-label mb-1.5">In the room</dt>
                  <dd className="text-sm leading-relaxed text-bone">
                    {loc.room.inclusions.join(' · ')}
                  </dd>
                </div>
              </dl>

              <Link
                href={`/${loc.slug}`}
                data-cursor="Look inside"
                className="mt-5 inline-flex items-center gap-2 border-b border-hairline-strong pb-1 text-sm text-chalk transition-colors duration-300 hover:border-chalk md:mt-8"
              >
                Everything about {loc.shortName}
                <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
