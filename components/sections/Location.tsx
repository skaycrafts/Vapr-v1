'use client';

import { useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import Frame from '@/components/media/Frame';
import { LOCATION, SITE, needsVerification } from '@/lib/content';
import { gsap, useIsoLayoutEffect } from '@/lib/gsap';

const { distances, coordinates } = needsVerification;
const FURTHEST = Math.max(...distances.map((d) => d.km));
const RINGS = [2, 4, 6, 8, 10];

/**
 * Distance drawn to scale on concentric rings — the same geometry as the
 * seal, put to work. It answers "how far is the airport" faster than a list
 * of numbers does, and the list is underneath it regardless.
 */
function RadialMap() {
  const R = 96;
  return (
    <svg viewBox="0 0 220 220" className="w-full" role="img" aria-label="Distances from VAPR, drawn to scale">
      <g fill="none" stroke="currentColor" strokeWidth={0.7} className="text-ash">
        {RINGS.map((km) => (
          <circle key={km} cx={110} cy={110} r={(km / (FURTHEST * 1.08)) * R} />
        ))}
      </g>

      {/* Crosshair through the property. */}
      <g stroke="currentColor" strokeWidth={0.7} className="text-graphite">
        <line x1={110 - R} y1={110} x2={110 + R} y2={110} />
        <line x1={110} y1={110 - R} x2={110} y2={110 + R} />
      </g>

      {distances.map((d, i) => {
        // Spread the marks around the dial; the angle is presentational, the
        // radius is the datum.
        const angle = (-58 + i * 74) * (Math.PI / 180);
        const r = (d.km / (FURTHEST * 1.08)) * R;
        const x = 110 + Math.cos(angle) * r;
        const y = 110 + Math.sin(angle) * r;
        return (
          <g key={d.place} className="location-mark">
            <line x1={110} y1={110} x2={x} y2={y} stroke="currentColor" strokeWidth={0.6} className="text-graphite" />
            <circle cx={x} cy={y} r={3} fill="currentColor" className="text-chalk" />
          </g>
        );
      })}

      <circle cx={110} cy={110} r={4.5} fill="none" stroke="currentColor" strokeWidth={1.2} className="text-chalk" />
      <circle cx={110} cy={110} r={1.6} fill="currentColor" className="text-chalk" />
    </svg>
  );
}

export default function Location() {
  const root = useRef<HTMLElement>(null);

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap.from('.location-mark', {
        opacity: 0,
        scale: 0.4,
        transformOrigin: '110px 110px',
        duration: 0.8,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 68%' },
      });
      gsap.from('.location-row', {
        opacity: 0,
        y: 14,
        duration: 0.7,
        ease: 'expo.out',
        stagger: 0.07,
        scrollTrigger: { trigger: el, start: 'top 68%' },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`;

  return (
    <section ref={root} id="location" className="gutter relative bg-void py-20 md:py-32">
      <div className="grid gap-14 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-5">
          <h2 className="type-display text-[clamp(2rem,4.4vw,3.5rem)] text-chalk">
            {LOCATION.title}
          </h2>
          <p className="mt-6 max-w-[42ch] text-lg leading-relaxed text-mist">{LOCATION.body}</p>

          <address className="mt-10 not-italic">
            <p className="text-bone">{SITE.street}</p>
            <p className="text-bone">
              {SITE.locality}, {SITE.city} {SITE.postalCode}
            </p>
            <p className="tabular mt-3 text-sm text-smoke">
              {coordinates.lat.toFixed(4)}&thinsp;N&nbsp;&nbsp;{coordinates.lng.toFixed(4)}&thinsp;E
            </p>
          </address>

          <a
            href={mapsHref}
            target="_blank"
            rel="noreferrer noopener"
            data-cursor="Open map"
            className="mt-8 inline-flex items-center gap-2 border-b border-hairline-strong pb-1 text-sm text-chalk transition-colors duration-300 hover:border-chalk"
          >
            Open in Maps
            <ExternalLink size={14} strokeWidth={1.5} aria-hidden />
          </a>
        </div>

        <div className="md:col-span-3 md:pt-4">
          <div className="mx-auto max-w-[16rem] md:mx-0">
            <RadialMap />
          </div>
        </div>

        <div className="md:col-span-4 md:pt-4">
          <ul>
            {distances.map((d) => (
              <li
                key={d.place}
                className="location-row flex items-baseline justify-between gap-6 border-t border-hairline py-4 last:border-b"
              >
                <span className="text-bone">{d.place}</span>
                <span className="tabular shrink-0 text-sm text-smoke">{d.km.toFixed(1)} km</span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Frame slug="facade-street" sizes="(min-width: 768px) 32vw, 100vw" ratio={3 / 2} />
          </div>
        </div>
      </div>
    </section>
  );
}
