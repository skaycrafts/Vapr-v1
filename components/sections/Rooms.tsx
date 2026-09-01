'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import Frame from '@/components/media/Frame';
import Emblem from '@/components/brand/Emblem';
import { LOCATIONS, STAY } from '@/lib/content';
import { gsap, ScrollTrigger, useIsoLayoutEffect } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import type { ImageSlug } from '@/lib/media';

/**
 * One room category per property, side by side. On a wide screen the section
 * pins and the track translates, so vertical scroll reads as moving between
 * the two. Narrow screens get the same panels stacked, which is the honest
 * layout for a thumb.
 *
 * Guindy has not been photographed yet, so its panel is typographic. That
 * state is designed rather than empty — it should not read as a failed image.
 */
export default function Rooms() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const el = root.current;
    const rail = track.current;
    if (!el || !rail) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          horizontal: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
          stacked: '(max-width: 767px), (prefers-reduced-motion: reduce)',
        },
        (context) => {
          const { horizontal } = context.conditions as { horizontal: boolean };
          if (!horizontal) return;

          const distance = () => rail.scrollWidth - window.innerWidth;

          const tween = gsap.to(rail, {
            x: () => -distance(),
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start: 'top top',
              end: () => `+=${distance()}`,
              pin: true,
              scrub: 0.8,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          gsap.utils.toArray<HTMLElement>('.room-plate').forEach((plate) => {
            const img = plate.querySelector('img');
            if (!img) return;
            gsap.fromTo(
              img,
              { xPercent: -7 },
              {
                xPercent: 7,
                ease: 'none',
                scrollTrigger: {
                  trigger: plate,
                  containerAnimation: tween,
                  start: 'left right',
                  end: 'right left',
                  scrub: true,
                },
              }
            );
          });

          return () => {
            tween.scrollTrigger?.kill();
            tween.kill();
          };
        }
      );

      return () => mm.revert();
    }, el);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);

    return () => {
      window.removeEventListener('load', refresh);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={root} id="rooms" className="relative bg-void">
      <div
        ref={track}
        className="flex flex-col md:h-[100svh] md:flex-row md:flex-nowrap md:will-change-transform"
      >
        <div className="gutter flex shrink-0 flex-col justify-end py-16 md:h-full md:w-[34vw] md:justify-center md:py-0">
          <p className="type-label">The rooms</p>
          <h2 className="type-display mt-4 text-[clamp(2.25rem,5vw,4rem)] text-chalk">
            One room,
            <br />
            done properly.
          </h2>
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
              'room-panel gutter flex shrink-0 flex-col gap-8 border-t border-hairline py-14 md:h-full md:w-[80vw] md:items-center md:gap-12 md:border-l md:border-t-0 md:py-0',
              i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
            )}
          >
            <div className="room-plate aspect-[4/3] w-full overflow-hidden md:aspect-auto md:h-[62vh] md:w-[54%]">
              {loc.images.length ? (
                <Frame
                  slug={loc.images[0] as ImageSlug}
                  sizes="(min-width: 768px) 44vw, 100vw"
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

            <div className="md:w-[46%]">
              <div className="flex items-baseline gap-4">
                <span className="tabular type-label">{String(i + 1).padStart(2, '0')}</span>
                <span className="h-px flex-1 bg-hairline" />
                <span className="type-label">{loc.area}</span>
              </div>

              <h3 className="type-display mt-5 text-[clamp(2rem,4vw,3.25rem)] text-chalk">
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

              <dl className="mt-8 md:mt-9">
                {[
                  { label: 'Bed', value: loc.room.bed },
                  { label: 'Sleeps', value: loc.room.sleeps },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between gap-6 border-t border-hairline py-3"
                  >
                    <dt className="type-label">{row.label}</dt>
                    <dd className="text-right text-sm text-bone">{row.value}</dd>
                  </div>
                ))}
                <div className="border-t border-hairline py-3.5">
                  <dt className="type-label mb-2">In the room</dt>
                  <dd className="text-sm leading-relaxed text-bone">
                    {loc.room.inclusions.join(' · ')}
                  </dd>
                </div>
              </dl>

              <Link
                href={`/${loc.slug}`}
                data-cursor="Look inside"
                className="mt-8 inline-flex items-center gap-2 border-b border-hairline-strong pb-1 text-sm text-chalk transition-colors duration-300 hover:border-chalk"
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
