'use client';

import { useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import { SITE, mapsHref, type Location } from '@/lib/content';
import { gsap, useIsoLayoutEffect } from '@/lib/gsap';

const RINGS = [2, 4, 6, 8, 10];

/**
 * Distance drawn to scale on concentric rings — the same geometry as the seal,
 * put to work. It answers "how far is the airport" faster than a column of
 * numbers does, and the numbers are beside it regardless.
 *
 * Every distance comes from the property's own listing. The angles are
 * presentational; only the radius carries data, which the caption says.
 */
function RadialMap({ location }: { location: Location }) {
  const R = 96;
  const furthest = Math.max(...location.landmarks.map((l) => l.km));
  const scale = (km: number) => (km / (furthest * 1.08)) * R;

  return (
    <svg
      viewBox="0 0 220 220"
      className="w-full"
      role="img"
      aria-label={`Distances from ${location.name}, drawn to scale. ${location.landmarks
        .map((l) => `${l.place} ${l.km} kilometres`)
        .join('. ')}.`}
    >
      <g fill="none" stroke="currentColor" strokeWidth={0.7} className="text-ash">
        {RINGS.filter((km) => km <= furthest * 1.08).map((km) => (
          <circle key={km} cx={110} cy={110} r={scale(km)} />
        ))}
      </g>

      <g stroke="currentColor" strokeWidth={0.7} className="text-graphite">
        <line x1={110 - R} y1={110} x2={110 + R} y2={110} />
        <line x1={110} y1={110 - R} x2={110} y2={110 + R} />
      </g>

      {location.landmarks.map((d, i) => {
        const angle = (-64 + (i * 360) / location.landmarks.length) * (Math.PI / 180);
        const r = scale(d.km);
        return (
          <g key={d.place} className="gt-mark">
            <line
              x1={110}
              y1={110}
              x2={110 + Math.cos(angle) * r}
              y2={110 + Math.sin(angle) * r}
              stroke="currentColor"
              strokeWidth={0.55}
              className="text-graphite"
            />
            <circle
              cx={110 + Math.cos(angle) * r}
              cy={110 + Math.sin(angle) * r}
              r={2.6}
              fill="currentColor"
              className="text-chalk"
            />
          </g>
        );
      })}

      <circle cx={110} cy={110} r={4.5} fill="none" stroke="currentColor" strokeWidth={1.2} className="text-chalk" />
      <circle cx={110} cy={110} r={1.6} fill="currentColor" className="text-chalk" />
    </svg>
  );
}

export default function GettingThere({ location }: { location: Location }) {
  const root = useRef<HTMLElement>(null);

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap.from('.gt-mark', {
        opacity: 0,
        scale: 0.4,
        transformOrigin: '110px 110px',
        duration: 0.7,
        ease: 'expo.out',
        stagger: 0.06,
        scrollTrigger: { trigger: el, start: 'top 70%' },
      });
      gsap.from('.gt-row', {
        opacity: 0,
        y: 12,
        duration: 0.6,
        ease: 'expo.out',
        stagger: 0.045,
        scrollTrigger: { trigger: el, start: 'top 70%' },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="getting-there" className="gutter relative bg-void py-20 md:py-28">
      <div className="grid gap-12 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-4">
          <h2 className="type-display text-[clamp(2rem,4.4vw,3.5rem)] text-chalk">Getting there</h2>
          <address className="mt-7 not-italic text-lg leading-relaxed text-mist">
            {location.street}
            <br />
            {location.area}, {SITE.city} {location.postalCode}
          </address>

          <a
            href={mapsHref(location)}
            target="_blank"
            rel="noreferrer noopener"
            data-cursor="Open map"
            className="mt-7 inline-flex items-center gap-2 border-b border-hairline-strong pb-1 text-sm text-chalk transition-colors duration-300 hover:border-chalk"
          >
            Open in Maps
            <ExternalLink size={14} strokeWidth={1.5} aria-hidden />
          </a>

          <div className="mx-auto mt-12 max-w-[15rem] md:mx-0">
            <RadialMap location={location} />
            <p className="mt-4 text-xs text-smoke">
              Rings at 2 km intervals. Distance is to scale; direction is not.
            </p>
          </div>
        </div>

        <div className="md:col-span-7 md:col-start-6">
          <h3 className="type-label mb-2">What is near</h3>
          <ul className="sm:columns-2 sm:gap-x-10">
            {location.landmarks.map((d) => (
              <li
                key={d.place}
                className="gt-row flex items-baseline justify-between gap-6 border-t border-hairline py-3.5 sm:break-inside-avoid"
              >
                <span className="text-bone">{d.place}</span>
                <span className="tabular shrink-0 text-sm text-smoke">
                  {d.km < 1 ? `${Math.round(d.km * 1000)} m` : `${d.km.toFixed(1)} km`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
