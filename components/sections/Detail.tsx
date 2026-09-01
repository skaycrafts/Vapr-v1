'use client';

import { useRef } from 'react';
import Frame from '@/components/media/Frame';
import { DETAIL } from '@/lib/content';
import { gsap, useIsoLayoutEffect } from '@/lib/gsap';
import type { ImageSlug } from '@/lib/media';

const CLOSE_UPS: ImageSlug[] = ['detail-number', 'detail-switch', 'detail-latch', 'detail-books'];

/**
 * The full inventory, set as a specification sheet rather than a grid of
 * icons: hairline rules, tabular numbering, no illustration standing in for a
 * fact. A guest scanning for one item can find it in a single pass.
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
        scrollTrigger: { trigger: '.detail-sheet', start: 'top 76%' },
      });

      // The close-up strip tracks slightly against the scroll.
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
    <section ref={root} id="detail" className="relative overflow-hidden bg-void py-20 md:py-32">
      <div className="gutter">
        <header className="flex flex-col gap-6 border-b border-hairline pb-9 md:flex-row md:items-end md:justify-between">
          <h2 className="type-display max-w-[14ch] text-[clamp(2rem,4.4vw,3.5rem)] text-chalk">
            {DETAIL.title}
          </h2>
          <p className="max-w-[38ch] text-mist">{DETAIL.intro}</p>
        </header>

        <div className="detail-sheet grid gap-x-12 gap-y-12 pt-10 md:grid-cols-2 md:pt-14">
          {DETAIL.groups.map((group) => (
            <div key={group.heading}>
              <h3 className="type-label mb-2">{group.heading}</h3>
              <ul>
                {group.items.map((item, i) => (
                  <li
                    key={item}
                    className="detail-row group flex items-baseline gap-5 border-t border-hairline py-3.5 transition-colors duration-300 last:border-b hover:bg-carbon/60"
                  >
                    <span className="tabular w-6 shrink-0 text-2xs text-ash transition-colors duration-300 group-hover:text-smoke">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-bone">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Four things you actually touch. */}
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
