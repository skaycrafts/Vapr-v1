'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import Emblem from '@/components/brand/Emblem';
import Frame from '@/components/media/Frame';
import Parallax from '@/motion/primitives/Parallax';
import { CONTACT, CTA, FOOTER, LOCATIONS, NAV, SITE, mapsHref } from '@/lib/content';
import { gsap } from '@/lib/gsap';
import { useMotionEffect } from '@/motion/useMotionEffect';
import { CINEMA, EASE, SCRUB, STAGGER } from '@/motion/config';

/**
 * The last scene, and then the practical information.
 *
 * The footer is not revealed, it is arrived at (§20). A closing photograph
 * holds the frame, drifts upward as the page runs out, and the type emerges
 * from underneath it — city, then the two addresses, then the one thing left
 * to do. Only after that does the page become a list of details.
 *
 * Both addresses sit here in full, because the footer is where people look for
 * them. The wordmark is set once, at full size, at the very end — the only
 * place on the page it is allowed to be the largest thing.
 */
export default function Footer() {
  const root = useRef<HTMLElement>(null);

  useMotionEffect(root, () => {
    const el = root.current;
    if (!el) return;

    // The closing frame settles out of a slight over-scale. The drift itself
    // is handled by <Parallax> below, which also carries the pointer depth.
    gsap.fromTo(
      '.footer-plate img',
      { scale: 1.06 },
      {
        scale: 1,
        ease: EASE.none,
        scrollTrigger: {
          trigger: '.footer-scene',
          start: 'top bottom',
          end: 'bottom top',
          scrub: SCRUB.tight,
        },
      }
    );

    // City, addresses, and the one remaining action — in that order.
    gsap.from('.footer-lede > *', {
      yPercent: 60,
      opacity: 0,
      duration: CINEMA.base,
      ease: EASE.outLong,
      stagger: STAGGER.lines * 2,
      scrollTrigger: { trigger: '.footer-lede', start: 'top 88%', once: true },
    });

    gsap.from('.footer-col', {
      y: 22,
      opacity: 0,
      duration: CINEMA.fast,
      ease: EASE.out,
      stagger: STAGGER.items,
      scrollTrigger: { trigger: '.footer-cols', start: 'top 90%', once: true },
    });

    gsap.from('.footer-wordmark > span', {
      yPercent: 108,
      duration: CINEMA.slow,
      ease: EASE.outLong,
      scrollTrigger: { trigger: '.footer-wordmark', start: 'top 92%', once: true },
    });

    // The seal used to rotate 90° across the footer's scroll. Chennai's whole
    // closing movement rests on the mark being the one thing that does not
    // perform — it "does not spin, draw, pulse or shimmer" — and a
    // scroll-linked logo rotation two sections later contradicts that for no
    // reason beyond decoration. It sits still now.
  });

  return (
    <footer ref={root} className="relative border-t border-hairline bg-void">
      {/* The closing scene. */}
      <div className="footer-scene relative h-[52svh] min-h-[18rem] overflow-hidden md:h-[68svh]">
        {/* The last image on the site, and the only one that gets pointer
            depth — a few pixels, on a sky, at the moment the page stops. */}
        <Parallax className="footer-plate absolute inset-0" layer="image" mouse="image">
          <Frame
            slug="sky-cutout"
            ratio="fill"
            sizes="100vw"
            className="h-full w-full"
            position="50% 45%"
          />
        </Parallax>

        {/* The type has to stay legible over whatever the sky is doing. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, transparent 30%, color-mix(in oklab, var(--color-void) 88%, transparent) 100%)',
          }}
        />

        <div className="gutter footer-lede absolute inset-x-0 bottom-0 pb-10 md:pb-14">
          <p className="type-display text-[clamp(2.5rem,9vw,7rem)] leading-[0.95] text-chalk">
            {SITE.city}
          </p>

          <p className="type-label mt-4">
            {LOCATIONS.map((l) => l.shortName).join(' · ')}
          </p>

          <Link
            href={CTA.href}
            data-cursor="Open"
            className="group relative mt-8 inline-flex items-center gap-3 pb-2 text-lg text-chalk"
          >
            <span className="transition-transform duration-500 ease-[var(--ease-out-quart)] group-hover:translate-x-1">
              {CTA.label}
            </span>
            <ArrowUpRight
              size={18}
              strokeWidth={1.5}
              aria-hidden
              className="transition-transform duration-500 ease-[var(--ease-out-quart)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-hairline-strong" />
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-chalk transition-transform duration-700 ease-[var(--ease-out-quart)] group-hover:scale-x-100"
            />
          </Link>
        </div>
      </div>

      <div className="gutter overflow-hidden pt-16 md:pt-24">
        <div className="footer-cols grid gap-12 md:grid-cols-12 md:gap-10">
          <div className="footer-col md:col-span-3">
            <Emblem sizes="76px" className="footer-seal w-19" />
            <p className="mt-6 max-w-[32ch] text-mist">{FOOTER.note}</p>
          </div>

          {LOCATIONS.map((loc) => (
            <div key={loc.slug} className="footer-col md:col-span-3">
              <h2 className="type-label mb-4">{loc.shortName}</h2>
              <address className="not-italic text-bone">
                <p>{loc.street}</p>
                <p>
                  {loc.area}, {SITE.city} {loc.postalCode}
                </p>
              </address>
              <a
                href={mapsHref(loc)}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-3 inline-block text-sm text-smoke underline underline-offset-4 transition-colors hover:text-chalk"
              >
                Open in Maps
              </a>
              <p className="mt-3">
                <Link
                  href={`/${loc.slug}`}
                  className="text-bone transition-colors hover:text-chalk"
                >
                  About this one
                </Link>
              </p>
            </div>
          ))}

          <nav aria-label="Footer" className="footer-col md:col-span-3">
            <h2 className="type-label mb-4">Reach us</h2>
            {/* A dead `tel:` link is worse than an absent one: it looks
                like a way to reach the hotel and is not. */}
            {CONTACT.phoneHref ? (
              <a
                href={CONTACT.phoneHref}
                className="tabular block text-bone transition-colors hover:text-chalk"
              >
                {CONTACT.phone}
              </a>
            ) : (
              <p className="tabular block text-ash">Telephone — {CONTACT.unset.toLowerCase()}</p>
            )}
            {CONTACT.email ? (
              <a
                href={`mailto:${CONTACT.email}`}
                className="mt-1 block text-bone transition-colors hover:text-chalk"
              >
                {CONTACT.email}
              </a>
            ) : (
              <p className="mt-1 block text-ash">Email — {CONTACT.unset.toLowerCase()}</p>
            )}
            <ul className="mt-5 space-y-1.5">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-bone transition-colors hover:text-chalk">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/*
          The ceiling was 17rem — a fixed 272px whatever the screen is doing —
          which set the word at barely half the measure it is centred in. This
          is the one place on the page the wordmark is allowed to be the
          largest thing; at 53% of the column it was merely a large heading
          with a lot of air either side. 26vw is the size that actually fills
          the measure, and it holds the same proportion on a phone as on a
          desktop rather than collapsing to a cap at one end and a floor at
          the other.
        */}
        <div className="footer-wordmark mt-16 overflow-hidden pb-[0.06em] md:mt-24" aria-hidden>
          <span className="type-display block text-center text-[clamp(3.5rem,26vw,24rem)] leading-[1.02] tracking-[0.02em] text-chalk">
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
                <Link href={item.href} className="transition-colors hover:text-mist">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
