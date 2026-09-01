'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { LOCATIONS, LOCATIONS_INTRO, SITE, placeOf } from '@/lib/content';
import { gsap, useIsoLayoutEffect } from '@/lib/gsap';

/**
 * The first thing under the hero, because "which one?" is the first question
 * a two-property group has to answer.
 *
 * The two panels are typographic rather than photographic on purpose: one
 * property has been shot and the other has not, and a picture on one card and
 * a grey box on the other would read as a broken page rather than a choice.
 */
export default function Locations() {
  const root = useRef<HTMLElement>(null);

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap.from('.loc-copy > *', {
        y: 20,
        opacity: 0,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 76%' },
      });
      gsap.from('.loc-card', {
        y: 26,
        opacity: 0,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.12,
        scrollTrigger: { trigger: '.loc-cards', start: 'top 86%' },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      id="locations"
      aria-labelledby="locations-title"
      className="gutter relative bg-void py-20 md:py-28"
    >
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

      <p className="loc-copy type-label mt-14 md:mt-20">{LOCATIONS_INTRO.prompt}</p>

      <div className="loc-cards mt-5 grid gap-4 md:grid-cols-2 md:gap-5">
        {LOCATIONS.map((loc) => (
          <Link
            key={loc.slug}
            href={`/${loc.slug}`}
            data-cursor="Look inside"
            className="loc-card group relative flex flex-col justify-between overflow-hidden border border-hairline p-7 transition-colors duration-500 hover:border-hairline-strong focus-visible:border-chalk md:min-h-[19rem] md:p-9"
          >
            {/* Fills from the foot on hover — the panel lights up rather than
                lifting, which suits a page that never bounces. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-0 bg-carbon transition-[height] duration-[700ms] ease-[var(--ease-out-quart)] group-hover:h-full group-focus-visible:h-full"
            />

            <span className="relative flex items-start justify-between gap-6">
              <span className="type-label">{placeOf(loc)}</span>
              <ArrowUpRight
                size={20}
                strokeWidth={1.25}
                aria-hidden
                className="shrink-0 text-smoke transition-[transform,color] duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-chalk"
              />
            </span>

            <span className="relative mt-10 block md:mt-0">
              <span className="type-display block text-[clamp(2.25rem,4.6vw,3.5rem)] leading-none text-chalk">
                {loc.shortName}
              </span>
              <span className="mt-4 block max-w-[34ch] text-mist">{loc.blurb}</span>

              <span className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-smoke">
                <span className="tabular">
                  {loc.rating.score.toFixed(1)}
                  <span className="text-ash"> / 5</span>
                  <span className="ml-1.5">from {loc.rating.count} guests</span>
                </span>
                <span className="tabular">{loc.roomCount} rooms</span>
              </span>
            </span>
          </Link>
        ))}
      </div>

      <p className="loc-copy mt-8 max-w-[62ch] text-sm text-smoke">
        Both are in {SITE.city}, and whichever you choose the enquiry reaches the same
        people. Ratings are as recorded on Treebo, where both hotels are listed.
      </p>
    </section>
  );
}
