'use client';

import { useRef } from 'react';
import { Check, Minus } from 'lucide-react';
import Frame from '@/components/media/Frame';
import { DETAIL, LOCATIONS, STAY } from '@/lib/content';
import { gsap, useIsoLayoutEffect } from '@/lib/gsap';
import type { ImageSlug } from '@/lib/media';

const CLOSE_UPS: ImageSlug[] = ['detail-number', 'detail-switch', 'detail-latch', 'detail-books'];

/**
 * What is true of both properties, and where they differ. Set as a
 * specification sheet rather than a grid of icons: a guest scanning for one
 * item finds it in a single pass.
 *
 * The "not here" column is deliberate. Both listings state that laundry, a
 * pool and a gym are unavailable, and saying so plainly is worth more than
 * letting someone discover it at check-in.
 */
export default function Detail() {
  const root = useRef<HTMLElement>(null);

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap.from('.detail-row', {
        opacity: 0,
        y: 12,
        duration: 0.7,
        ease: 'expo.out',
        stagger: 0.035,
        scrollTrigger: { trigger: '.detail-sheet', start: 'top 78%' },
      });
      gsap.fromTo(
        '.detail-strip',
        { xPercent: 0 },
        {
          xPercent: -8,
          ease: 'none',
          scrollTrigger: { trigger: '.detail-strip', start: 'top bottom', end: 'bottom top', scrub: 1 },
        }
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="detail" className="relative overflow-hidden bg-void py-20 md:py-28">
      <div className="gutter">
        <header className="flex flex-col gap-6 border-b border-hairline pb-9 md:flex-row md:items-end md:justify-between">
          <h2 className="type-display max-w-[16ch] text-[clamp(2rem,4.4vw,3.5rem)] text-chalk">
            {DETAIL.title}
          </h2>
          <p className="max-w-[40ch] text-mist">{DETAIL.intro}</p>
        </header>

        <div className="detail-sheet grid gap-x-12 gap-y-12 pt-10 md:grid-cols-2 md:pt-14">
          <div>
            <h3 className="type-label mb-2">Included at both</h3>
            <ul>
              {STAY.included.map((item) => (
                <li
                  key={item}
                  className="detail-row flex items-baseline gap-4 border-t border-hairline py-3.5 last:border-b"
                >
                  <Check size={14} strokeWidth={1.75} aria-hidden className="shrink-0 translate-y-0.5 text-chalk" />
                  <span className="text-bone">{item}</span>
                </li>
              ))}
            </ul>

            <h3 className="type-label mb-2 mt-10">Not here, at either</h3>
            <ul>
              {STAY.notAvailable.map((item) => (
                <li
                  key={item}
                  className="detail-row flex items-baseline gap-4 border-t border-hairline py-3.5 last:border-b"
                >
                  <Minus size={14} strokeWidth={1.75} aria-hidden className="shrink-0 translate-y-0.5 text-ash" />
                  <span className="text-smoke">{item}</span>
                </li>
              ))}
            </ul>
            <p className="detail-row mt-4 max-w-[44ch] text-sm text-smoke">
              {STAY.earlyCheckIn}
            </p>
          </div>

          <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
            {LOCATIONS.map((loc) => (
              <div key={loc.slug}>
                <h3 className="type-label mb-2">{loc.shortName}</h3>
                <ul>
                  {loc.facilities.map((item) => (
                    <li
                      key={item}
                      className="detail-row border-t border-hairline py-3 text-sm text-bone last:border-b"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Four things you actually touch. Photographed at Ashok Nagar. */}
      <div className="detail-strip mt-14 flex gap-3 pl-[max(1.25rem,calc((100vw-90rem)/2))] md:mt-16 md:gap-4">
        {CLOSE_UPS.map((slug) => (
          <Frame
            key={slug}
            slug={slug}
            sizes="(min-width: 768px) 26vw, 62vw"
            ratio={4 / 5}
            className="w-[62vw] shrink-0 md:w-[26vw]"
          />
        ))}
      </div>
    </section>
  );
}
