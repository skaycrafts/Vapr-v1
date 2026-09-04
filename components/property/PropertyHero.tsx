'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star } from 'lucide-react';
import Frame from '@/components/media/Frame';
import Emblem from '@/components/brand/Emblem';
import RevealText from '@/motion/primitives/RevealText';
import RevealImage from '@/motion/primitives/RevealImage';
import { SITE, placeOf, type Location } from '@/lib/content';
import { gsap } from '@/lib/gsap';
import { useMotionEffect } from '@/motion/useMotionEffect';
import { CINEMA, EASE, SCRUB, STAGGER } from '@/motion/config';
import type { ImageSlug } from '@/lib/media';

/**
 * The head of a property page. Where a hero photograph exists it runs
 * full-bleed behind the name; where it does not, the seal takes the field
 * instead, at a scale that reads as a deliberate frontispiece rather than a
 * gap waiting for an image.
 *
 * The photograph arrives on `expand` — the reveal reserved for a chapter's
 * first image — so opening a property reads as the same kind of event as any
 * other arrival on the site, rather than as a page that simply appeared.
 */
export default function PropertyHero({ location }: { location: Location }) {
  const root = useRef<HTMLElement>(null);
  const hasPhoto = Boolean(location.heroImage);

  useMotionEffect(root, () => {
    const el = root.current;
    if (!el) return;

    gsap.from('.ph-meta', {
      opacity: 0,
      y: 14,
      duration: CINEMA.fast,
      ease: EASE.outLong,
      stagger: STAGGER.items,
      delay: 0.35,
    });

    gsap.to('.ph-plate', {
      yPercent: 12,
      ease: EASE.none,
      scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: SCRUB.tight },
    });
  });

  return (
    <section
      ref={root}
      className="relative flex min-h-[76svh] flex-col justify-end overflow-hidden bg-void pb-10 pt-28 md:min-h-[86svh] md:pb-14"
    >
      {hasPhoto ? (
        <>
          <RevealImage
            style="expand"
            immediate
            scaleFrom={1.1}
            className="ph-plate absolute inset-0 -top-[6%] h-[112%]"
          >
            <Frame
              slug={location.heroImage as ImageSlug}
              className="h-full w-full"
              ratio="fill"
              sizes="100vw"
              priority
              position="50% 45%"
            />
          </RevealImage>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, color-mix(in oklab, var(--color-void) 62%, transparent) 0%, transparent 22%, color-mix(in oklab, var(--color-void) 30%, transparent) 40%, color-mix(in oklab, var(--color-void) 74%, transparent) 62%, color-mix(in oklab, var(--color-void) 94%, transparent) 100%)',
            }}
          />
        </>
      ) : (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <Emblem sizes="(min-width: 768px) 480px, 62vmin" className="w-[min(62vmin,30rem)] opacity-[0.07]" />
        </div>
      )}

      <div className="gutter relative">
        <Link
          href="/"
          className="ph-meta mb-8 inline-flex items-center gap-2 text-sm text-mist transition-colors hover:text-chalk md:mb-10"
        >
          <ArrowLeft size={15} strokeWidth={1.5} aria-hidden />
          Both hotels
        </Link>

        <p className="ph-meta type-label">{placeOf(location)}</p>

        {/* The property's name is the largest statement on the page, so it
            gets the cinematic weight rather than the content weight (§06). */}
        <RevealText
          as="h1"
          mode="lines"
          immediate
          scale="cinema"
          delay={0.1}
          className="type-display mt-4 text-[clamp(2.5rem,8vw,6rem)] text-chalk"
        >
          {location.shortName}
        </RevealText>

        <div className="mt-8 flex flex-col gap-6 border-t border-hairline pt-6 md:flex-row md:items-end md:justify-between md:gap-12">
          <address className="ph-meta not-italic text-bone">
            <p>{location.street}</p>
            <p>
              {location.area}, {SITE.city} {location.postalCode}
            </p>
          </address>

          <dl className="ph-meta flex flex-wrap items-end gap-x-10 gap-y-4">
            <div>
              <dt className="type-label">Guest rating</dt>
              <dd className="mt-1 flex items-center gap-1.5 text-chalk">
                <Star size={15} strokeWidth={1.5} aria-hidden className="fill-chalk" />
                <span className="tabular text-xl">{location.rating.score.toFixed(1)}</span>
                <span className="text-sm text-smoke">
                  from {location.rating.count} guests on Treebo
                </span>
              </dd>
            </div>
            <div>
              <dt className="type-label">Rooms</dt>
              <dd className="tabular mt-1 text-xl text-chalk">{location.roomCount}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
