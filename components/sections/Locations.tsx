'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import RevealText from '@/motion/primitives/RevealText';
import { LOCATIONS, LOCATIONS_INTRO } from '@/lib/content';
import { gsap } from '@/lib/gsap';
import { useMotionEffect } from '@/motion/useMotionEffect';
import { CINEMA, EASE, STAGGER } from '@/motion/config';

/**
 * The first thing under the hero: which of the two, and a door to each.
 *
 * ── What this used to be ─────────────────────────────────────────────────
 * A full-height stage. The chosen property's photograph ran full-bleed across
 * an 88svh frame with its name set into the foot, its blurb, its room count
 * and its guest rating below; the other property stood at the right edge as a
 * tall sliver of its own photograph, and a ~1.1s timeline crossed the two
 * whenever you switched. It was the most worked-on interaction on the site.
 *
 * It has gone, because both hotels have their own page now and every fact it
 * showed is on that page, said better and in more detail. Showing Ashok
 * Nagar's rooms and rating on the homepage meant a visitor read them here,
 * then read them again one click later — and the sliver quietly implied the
 * two properties were a thing you toggle between rather than two hotels with
 * two addresses.
 *
 * So the homepage answers the only question it is well placed to answer —
 * there are two of us, here is roughly where — and hands over. The two
 * buttons are the whole mechanism.
 *
 * The stage is not lost; it is in the history of this file, and the motion it
 * pioneered is still in use elsewhere. Nothing needed it structurally: it was
 * only ever rendered on the homepage, and no link or scroll cue pointed at it.
 */
export default function Locations() {
  const root = useRef<HTMLElement>(null);

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

  return (
    <section
      ref={root}
      id="locations"
      aria-labelledby="locations-title"
      className="relative bg-paper"
    >
      <div className="gutter py-20 md:py-28">
        {/* The 12-column split waits for `lg`, not `md`. At 768 it gave the
              heading a 350px column and the sentence a 270px one — "Ashok
              Nagar & Guindy" broke mid-word and the two buttons stacked
              on top of each other. A tablet reads this better in one column,
              which is what it now gets up to 1024. */}
          <div className="loc-copy grid gap-10 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <p data-lede className="type-label">
              {LOCATIONS_INTRO.eyebrow}
            </p>
            <RevealText
              as="h2"
              id="locations-title"
              mode="lines"
              className="type-display mt-4 text-[clamp(2.25rem,5vw,4rem)] text-ink"
            >
              {LOCATIONS_INTRO.title}
            </RevealText>
          </div>

          <div className="space-y-6 lg:col-span-5 lg:col-start-8 lg:pt-3">
            <p
              data-lede
              className="max-w-[46ch] whitespace-pre-line text-lg leading-relaxed text-mist"
            >
              {LOCATIONS_INTRO.body}
            </p>

            {/*
              The two ways in, still driven by `area` rather than by two
              hard-coded labels — though the two fields now agree. `area` was
              "Ekkatuthangal" and `shortName` "Guindy", and this used `area` so
              the buttons matched the sentence above them. Both say Guindy now,
              so the choice no longer matters visually; it is kept because the
              data should still be what decides.
            */}
            <div data-lede className="flex flex-wrap gap-3">
              {LOCATIONS.map((loc) => (
                <Link
                  key={loc.slug}
                  href={`/${loc.slug}`}
                  data-cursor="Explore"
                  className="group inline-flex items-center gap-2.5 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors duration-500 hover:bg-bone"
                >
                  {loc.area}
                  <ArrowUpRight
                    size={15}
                    strokeWidth={1.5}
                    aria-hidden
                    className="transition-transform duration-500 ease-[var(--ease-out-quart)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
