'use client';

import { useRef } from 'react';
import { Check } from 'lucide-react';
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
      stagger: STAGGER.rows,
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
          Three panes: what both hotels give you, and then each property's own
          list.

          ── On the glass ────────────────────────────────────────────────────
          These are `<Glass>` again. I had taken it off on the grounds that
          refraction over a flat black ground has nothing to bend, so what
          survives is the material dressing — the tint, the rim highlight, the
          cast shadow — and not the optics the component exists for. That is
          still true, and it is a preference rather than a defect: the dressing
          is what reads as a panel here, and the panel is what was asked for.

          The one thing worth knowing is that this is where the effect is
          cheapest to lose. If these ever want the real bend, the section needs
          something behind them to bend — the reserve panel gets it from the
          photograph it floats over.

          ── On what is missing ──────────────────────────────────────────────
          There used to be a fourth pane, "Not here, at either", listing the
          laundry, the pool and the gym. It has gone. The early check-in note
          that lived at the foot of it has gone with it, but not from the site:
          both property pages still carry it under their own check-in times.
        */}
        <div className="detail-sheet grid gap-3 pt-10 sm:grid-cols-2 md:pt-14 xl:grid-cols-3">
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

          {LOCATIONS.map((loc) => (
            <Glass key={loc.slug} className="rounded-2xl p-6 md:p-7" radius={16} scale={-58}>
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
