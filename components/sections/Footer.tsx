'use client';

import { useRef } from 'react';
import Emblem from '@/components/brand/Emblem';
import { FOOTER, NAV, SITE, needsVerification } from '@/lib/content';
import { gsap, useIsoLayoutEffect } from '@/lib/gsap';

/**
 * The wordmark is set once, at full size, at the end — the only place on the
 * page it is allowed to be the largest thing. It rises out of a mask as the
 * footer arrives, which is the last piece of motion the site performs.
 */
export default function Footer() {
  const root = useRef<HTMLElement>(null);

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap.from('.footer-wordmark > span', {
        yPercent: 108,
        duration: 1.5,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.footer-wordmark', start: 'top 92%' },
      });
      gsap.to('.footer-seal', {
        rotate: 90,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom bottom', scrub: 1.4 },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <footer ref={root} className="gutter relative overflow-hidden border-t border-hairline bg-void pt-16 md:pt-24">
      <div className="grid gap-12 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-4">
          <Emblem variant="simple" className="footer-seal w-16 text-chalk" />
          <p className="mt-6 max-w-[34ch] text-mist">{FOOTER.note}</p>
        </div>

        <div className="md:col-span-3 md:col-start-6">
          <h2 className="type-label mb-4">Visit</h2>
          <address className="not-italic text-bone">
            <p>{SITE.street}</p>
            <p>
              {SITE.locality}, {SITE.city} {SITE.postalCode}
            </p>
          </address>
          <a
            href={needsVerification.phoneHref}
            className="tabular mt-4 inline-block text-bone transition-colors hover:text-chalk"
          >
            {needsVerification.phone}
          </a>
          <a
            href={`mailto:${needsVerification.email}`}
            className="mt-1 block text-bone transition-colors hover:text-chalk"
          >
            {needsVerification.email}
          </a>
        </div>

        <nav aria-label="Footer" className="md:col-span-3 md:col-start-10">
          <h2 className="type-label mb-4">Pages</h2>
          <ul className="space-y-1.5">
            {NAV.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="text-bone transition-colors hover:text-chalk">
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a href="#reserve" className="text-bone transition-colors hover:text-chalk">
                Reserve
              </a>
            </li>
          </ul>
        </nav>
      </div>

      {/* The wordmark, once, at the end. */}
      <div className="footer-wordmark mt-16 overflow-hidden pb-[0.06em] md:mt-24" aria-hidden>
        <span className="type-display block text-center text-[clamp(4rem,20vw,17rem)] leading-[1.02] tracking-[0.02em] text-chalk">
          VAPR
        </span>
      </div>

      <div className="flex flex-col gap-3 border-t border-hairline py-7 text-xs text-smoke sm:flex-row sm:items-center sm:justify-between">
        <p>
          &copy; {new Date().getFullYear()} {SITE.legalName}
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-1">
          {FOOTER.legal.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="transition-colors hover:text-mist">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
