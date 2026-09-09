'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Emblem from '@/components/brand/Emblem';
import { CONTACT, FOOTER, LOCATIONS, SITE, mapsHref } from '@/lib/content';
import { gsap } from '@/lib/gsap';
import { useMotionEffect } from '@/motion/useMotionEffect';
import { CINEMA, EASE, STAGGER } from '@/motion/config';

/**
 * The practical information, and then the wordmark.
 *
 * ── What used to open it ────────────────────────────────────────────────
 * A closing scene: a full-bleed photograph over half the viewport, drifting
 * on scroll and carrying pointer depth, with the city set across it at up to
 * 7rem, both areas under that, and a last call to action. It has gone.
 *
 * It was the fourth time the page said the same thing. The header now carries
 * Book now on every screen and follows you down; the enquiry itself sits
 * directly above this; and the two addresses are printed in full a few
 * hundred pixels below, where someone looking for them actually reads. A
 * half-viewport photograph to restate all of it delayed the details it sat on
 * top of and asked one more time for something the page had already asked for
 * twice.
 *
 * So the footer is a footer. Both addresses sit here in full, because this is
 * where people look for them, and the wordmark is set once at full size at
 * the very end — the only place on the page it is allowed to be the largest
 * thing.
 */
export default function Footer() {
  const root = useRef<HTMLElement>(null);

  useMotionEffect(root, () => {
    const el = root.current;
    if (!el) return;

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
      <div className="gutter overflow-hidden pt-20 md:pt-28">
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
              {/* Straight off LOCATIONS now that NAV has gone. These were the
                  same two links written a second time; with the header down to
                  one button, this list and the homepage's two doors are how
                  anyone reaches a property, so it should not be able to fall
                  out of step with the properties themselves. */}
              {LOCATIONS.map((loc) => (
                <li key={loc.slug}>
                  <Link
                    href={`/${loc.slug}`}
                    className="text-bone transition-colors hover:text-chalk"
                  >
                    {loc.shortName}
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
