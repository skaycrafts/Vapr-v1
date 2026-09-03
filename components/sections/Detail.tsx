'use client';

import { useRef } from 'react';
import { Check, Minus } from 'lucide-react';
import Frame from '@/components/media/Frame';
import Glass from '@/components/ui/Glass';
import RevealText from '@/motion/primitives/RevealText';
import RevealImage from '@/motion/primitives/RevealImage';
import { DETAIL, LOCATIONS, STAY } from '@/lib/content';
import { gsap } from '@/lib/gsap';
import { useMotionEffect } from '@/motion/useMotionEffect';
import { CONTENT, EASE, SCRUB, STAGGER } from '@/motion/config';
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

  useMotionEffect(root, () => {
    // A specification sheet: the rows should arrive quickly and get out of
    // the way. This is the one section where reading speed beats
    // choreography, so the stagger is the tightest on the site.
    gsap.from('.detail-row', {
      opacity: 0,
      y: 12,
      duration: CONTENT.base,
      ease: EASE.outLong,
      stagger: STAGGER.chars * 3,
      scrollTrigger: { trigger: '.detail-sheet', start: 'top 78%', once: true },
    });

    gsap.fromTo(
      '.detail-strip',
      { xPercent: 0 },
      {
        xPercent: -8,
        ease: EASE.none,
        scrollTrigger: {
          trigger: '.detail-strip',
          start: 'top bottom',
          end: 'bottom top',
          scrub: SCRUB.loose,
        },
      }
    );
  });

  return (
    <section ref={root} id="detail" className="relative overflow-hidden bg-void py-20 md:py-28">
      <div className="gutter">
        <header className="flex flex-col gap-6 border-b border-hairline pb-9 md:flex-row md:items-end md:justify-between">
          {/* A major section title, so it gets the line reveal rather than a
              fade — the type is uncovered by its own mask (§06). */}
          <RevealText
            as="h2"
            mode="lines"
            className="type-display max-w-[16ch] text-[clamp(2rem,4.4vw,3.5rem)] text-chalk"
          >
            {DETAIL.title}
          </RevealText>
          <p className="max-w-[40ch] text-mist">{DETAIL.intro}</p>
        </header>

        {/*
          Four panes: what both hotels give you, what neither does, and then
          each property's own list. Set as glass rather than as rules on a flat
          field so the specification reads as four separate answers instead of
          one long column a guest has to parse.

          One box per question, and the boxes stay the same shape whatever
          length the list inside them happens to be.
        */}
        <div className="detail-sheet grid gap-3 pt-10 sm:grid-cols-2 md:pt-14 xl:grid-cols-4">
          <Glass className="rounded-2xl p-6 md:p-7" radius={16} scale={-58}>
            <h3 className="type-label mb-4">Included at both</h3>
            <ul>
              {STAY.included.map((item) => (
                <li
                  key={item}
                  className="detail-row flex items-baseline gap-3 border-t border-hairline py-3 first:border-t-0 first:pt-0"
                >
                  <Check
                    size={14}
                    strokeWidth={1.75}
                    aria-hidden
                    className="shrink-0 translate-y-0.5 text-chalk"
                  />
                  <span className="text-sm text-bone">{item}</span>
                </li>
              ))}
            </ul>
          </Glass>

          <Glass className="rounded-2xl p-6 md:p-7" radius={16} scale={-58}>
            <h3 className="type-label mb-4">Not here, at either</h3>
            <ul>
              {STAY.notAvailable.map((item) => (
                <li
                  key={item}
                  className="detail-row flex items-baseline gap-3 border-t border-hairline py-3 first:border-t-0 first:pt-0"
                >
                  <Minus
                    size={14}
                    strokeWidth={1.75}
                    aria-hidden
                    className="shrink-0 translate-y-0.5 text-ash"
                  />
                  <span className="text-sm text-smoke">{item}</span>
                </li>
              ))}
            </ul>
            <p className="detail-row mt-4 border-t border-hairline pt-4 text-xs leading-relaxed text-smoke">
              {STAY.earlyCheckIn}
            </p>
          </Glass>

          {LOCATIONS.map((loc) => (
            <Glass
              key={loc.slug}
              className="rounded-2xl p-6 md:p-7"
              radius={16}
              scale={-58}
            >
              <h3 className="type-label mb-4">{loc.shortName}</h3>
              <ul>
                {loc.facilities.map((item) => (
                  <li
                    key={item}
                    className="detail-row border-t border-hairline py-3 text-sm text-bone first:border-t-0 first:pt-0"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Glass>
          ))}
        </div>
      </div>

      {/* Four things you actually touch. Photographed at Ashok Nagar. */}
      <div className="detail-strip mt-14 flex gap-3 pl-[max(1.25rem,calc((100vw-90rem)/2))] md:mt-16 md:gap-4">
        {CLOSE_UPS.map((slug, i) => (
          // `crop` is the quietest of the four signature reveals — right for
          // supporting imagery that should not announce itself (§10).
          <RevealImage
            key={slug}
            style="crop"
            delay={i * 0.06}
            scaleFrom={1.08}
            className="w-[62vw] shrink-0 md:w-[26vw]"
          >
            <Frame
              slug={slug}
              sizes="(min-width: 768px) 26vw, 62vw"
              ratio={4 / 5}
              className="w-full"
            />
          </RevealImage>
        ))}
      </div>
    </section>
  );
}
