'use client';

import { useRef } from 'react';
import Frame from '@/components/media/Frame';
import { ARRIVAL } from '@/lib/content';
import { gsap, useIsoLayoutEffect } from '@/lib/gsap';

/**
 * The building, annotated. The leader lines borrow the hairline weight of the
 * seal and read like a survey drawing laid over the photograph — which is
 * also the plainest way to point at three things at once.
 */
export default function Arrival() {
  const root = useRef<HTMLElement>(null);

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      // The photograph opens from the bottom edge as the section rises.
      gsap.from('.arrival-plate', {
        clipPath: 'inset(0% 0% 100% 0%)',
        duration: 1.5,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 78%' },
      });

      // Slow counter-drift, so the plate is never quite locked to the page.
      gsap.fromTo(
        '.arrival-plate img',
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        }
      );

      gsap.from('.arrival-mark', {
        opacity: 0,
        duration: 0.5,
        stagger: 0.14,
        scrollTrigger: { trigger: el, start: 'top 58%' },
      });
      gsap.from('.arrival-mark-rule', {
        scaleX: 0,
        transformOrigin: 'right center',
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.14,
        scrollTrigger: { trigger: el, start: 'top 58%' },
      });

      gsap.from('.arrival-copy > *', {
        y: 22,
        opacity: 0,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.09,
        scrollTrigger: { trigger: '.arrival-copy', start: 'top 82%' },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="arrival" className="gutter relative bg-void pb-20 pt-6 md:pb-32 md:pt-10">
      <div className="grid gap-12 md:grid-cols-12 md:gap-10">
        <div className="arrival-copy md:col-span-4 md:pt-6">
          <h2 className="type-display text-[clamp(2rem,4.4vw,3.5rem)] text-chalk">
            {ARRIVAL.title}
          </h2>
          <div className="mt-7 space-y-5 md:mt-10">
            {ARRIVAL.body.map((para) => (
              <p key={para} className="max-w-[46ch] text-lg leading-relaxed text-mist">
                {para}
              </p>
            ))}
          </div>
        </div>

        <div className="relative md:col-span-8">
          <div className="arrival-plate overflow-hidden">
            <Frame
              slug="facade-canopy"
              sizes="(min-width: 768px) 66vw, 100vw"
              imgClassName="scale-[1.12]"
              ratio={4 / 5}
            />
          </div>

          {/* Leader lines. Decorative — the same facts are in the copy. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden mix-blend-difference md:block"
          >
            {ARRIVAL.marks.map((mark) => (
              <div
                key={mark.label}
                className="arrival-mark absolute right-5 flex items-center gap-3"
                style={{ top: `${mark.at}%` }}
              >
                <span className="arrival-mark-rule block h-px w-[clamp(2rem,6vw,5rem)] origin-right bg-chalk" />
                <span className="size-[5px] shrink-0 rounded-full bg-chalk" />
                <span className="type-label whitespace-nowrap text-chalk">{mark.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
