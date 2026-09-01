'use client';

import { useRef } from 'react';
import Frame from '@/components/media/Frame';
import { ROOMS, needsVerification } from '@/lib/content';
import { gsap, ScrollTrigger, useIsoLayoutEffect } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import type { ImageSlug } from '@/lib/media';

/**
 * On a wide screen the three rooms run sideways: the section pins and the
 * track translates, so vertical scroll reads as walking down a corridor.
 * Narrow screens get the same panels stacked, which is the honest layout for
 * a thumb — a horizontal rail on a phone is a trap, not a flourish.
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

          // Each plate drifts against the rail, so the panels have depth
          // rather than sliding as one flat sheet.
          const plates = gsap.utils.toArray<HTMLElement>('.room-plate');
          plates.forEach((plate) => {
            gsap.fromTo(
              plate.querySelector('img'),
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

    // The rail's width depends on fonts and images settling.
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
        {/* Opening plate: the section title travels with the rail. */}
        <div className="gutter flex shrink-0 flex-col justify-end py-16 md:h-full md:w-[34vw] md:justify-center md:py-0">
          <p className="type-label">Three rooms</p>
          <h2 className="type-display mt-4 text-[clamp(2.25rem,5vw,4rem)] text-chalk">
            Every one
            <br />
            of them.
          </h2>
          <p className="mt-6 max-w-[30ch] text-mist">
            There are three. This is all of them, at the size they actually are.
          </p>
          <p className="tabular mt-8 text-sm text-smoke">
            From {needsVerification.currency} {needsVerification.ratesFrom.toLocaleString('en-IN')} a night
          </p>
        </div>

        {ROOMS.map((room, i) => (
          <article
            key={room.id}
            className={cn(
              'room-panel gutter flex shrink-0 flex-col gap-8 border-t border-hairline py-14 md:h-full md:w-[80vw] md:items-center md:gap-12 md:border-l md:border-t-0 md:py-0',
              i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
            )}
          >
            <div className="room-plate aspect-[4/3] w-full overflow-hidden md:aspect-auto md:h-[62vh] md:w-[58%]">
              <Frame
                slug={room.images[0] as ImageSlug}
                sizes="(min-width: 768px) 46vw, 100vw"
                ratio="fill"
                className="h-full w-full"
                imgClassName="scale-[1.08]"
              />
            </div>

            <div className="md:w-[42%]">
              <div className="flex items-baseline gap-4">
                <span className="tabular type-label">{room.index}</span>
                <span className="h-px flex-1 bg-hairline" />
                <span className="type-label">{room.sleeps}</span>
              </div>

              <h3 className="type-display mt-5 text-[clamp(2rem,4vw,3.25rem)] text-chalk">
                {room.name}
              </h3>

              <p className="mt-5 max-w-[42ch] text-mist">{room.note}</p>

              <dl className="mt-8 md:mt-10">
                {room.spec.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between gap-6 border-t border-hairline py-3 last:border-b"
                  >
                    <dt className="type-label">{row.label}</dt>
                    <dd className="text-right text-sm text-bone">{row.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-8 flex gap-2">
                {room.images.slice(1).map((slug) => (
                  <Frame
                    key={slug}
                    slug={slug as ImageSlug}
                    sizes="120px"
                    ratio={1}
                    className="w-[clamp(66px,9vw,104px)]"
                  />
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
