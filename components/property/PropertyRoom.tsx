'use client';

import { useRef } from 'react';
import Frame from '@/components/media/Frame';
import Emblem from '@/components/brand/Emblem';
import { STAY, type Location } from '@/lib/content';
import { gsap, useIsoLayoutEffect } from '@/lib/gsap';
import type { ImageSlug } from '@/lib/media';

/**
 * The property's own words, its single room category, and what is in it.
 *
 * The gallery only renders where photographs exist. Rather than filling the
 * space with pictures of the other hotel — which would be a quiet lie about
 * which building you are looking at — an unphotographed property says so.
 */
export default function PropertyRoom({ location }: { location: Location }) {
  const root = useRef<HTMLElement>(null);
  const gallery = location.images.slice(1);

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap.from('.pr-note', {
        y: 20,
        opacity: 0,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.09,
        scrollTrigger: { trigger: el, start: 'top 78%' },
      });
      gsap.from('.pr-row', {
        y: 12,
        opacity: 0,
        duration: 0.7,
        ease: 'expo.out',
        stagger: 0.05,
        scrollTrigger: { trigger: '.pr-spec', start: 'top 82%' },
      });
      gsap.from('.pr-shot', {
        y: 28,
        opacity: 0,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.08,
        scrollTrigger: { trigger: '.pr-gallery', start: 'top 84%' },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="room" className="gutter relative bg-void py-20 md:py-28">
      <div className="grid gap-12 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-5">
          {location.note.map((para) => (
            <p key={para} className="pr-note mb-5 max-w-[46ch] text-lg leading-relaxed text-mist">
              {para}
            </p>
          ))}
        </div>

        <div className="md:col-span-6 md:col-start-7">
          <p className="pr-note type-label">The room</p>
          <h2 className="pr-note type-display mt-3 text-[clamp(2rem,4.4vw,3.5rem)] text-chalk">
            {location.room.name}
          </h2>

          <dl className="pr-spec mt-8">
            <div className="pr-row flex items-baseline justify-between gap-6 border-t border-hairline py-3.5">
              <dt className="type-label">Bed</dt>
              <dd className="text-right text-sm text-bone">{location.room.bed}</dd>
            </div>
            <div className="pr-row flex items-baseline justify-between gap-6 border-t border-hairline py-3.5">
              <dt className="type-label">Sleeps</dt>
              <dd className="text-right text-sm text-bone">{location.room.sleeps}</dd>
            </div>
            <div className="pr-row flex items-baseline justify-between gap-6 border-t border-hairline py-3.5">
              <dt className="type-label">Rooms of this kind</dt>
              <dd className="tabular text-right text-sm text-bone">{location.roomCount}</dd>
            </div>
            <div className="pr-row border-y border-hairline py-4">
              <dt className="type-label mb-2">In the room</dt>
              <dd>
                <ul className="grid gap-x-6 gap-y-1.5 text-sm text-bone sm:grid-cols-2">
                  {location.room.inclusions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>

          <div className="pr-row mt-8">
            <p className="type-label mb-2">In the building</p>
            <p className="text-sm leading-relaxed text-bone">{location.facilities.join(' · ')}</p>
          </div>

          <p className="pr-row mt-6 text-sm text-smoke">
            Check in from {STAY.checkIn}, out by {STAY.checkOut}. {STAY.earlyCheckIn}
          </p>
        </div>
      </div>

      {gallery.length ? (
        <div className="pr-gallery mt-16 grid grid-cols-2 gap-3 md:mt-20 md:grid-cols-4 md:gap-4">
          {gallery.map((slug, i) => (
            <Frame
              key={slug}
              slug={slug as ImageSlug}
              sizes="(min-width: 768px) 24vw, 48vw"
              ratio={i % 3 === 0 ? 3 / 4 : 1}
              className="pr-shot"
            />
          ))}
        </div>
      ) : (
        <div className="pr-gallery mt-16 flex flex-col items-center gap-5 border border-hairline bg-pitch px-6 py-16 text-center md:mt-20">
          <Emblem variant="mark" className="w-20 text-graphite md:w-24" />
          <p className="max-w-[42ch] text-mist">
            {location.shortName} has not been photographed yet.
          </p>
          <p className="max-w-[46ch] text-sm text-smoke">
            Everything above is accurate — it comes from the property. Write to the desk
            and they will send you pictures of the room before you book.
          </p>
        </div>
      )}
    </section>
  );
}
