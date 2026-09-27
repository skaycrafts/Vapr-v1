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

    // Triggered by the row above it, not by the word. The word is the last
    // thing on the page and ends flush with it, so on a phone its top is
    // never more than ~65px above the bottom of the screen — past `top 92%`
    // at no scroll position, and the word stayed hidden below its own crop.
    gsap.from('.footer-wordmark > span', {
      yPercent: 108,
      duration: CINEMA.slow,
      ease: EASE.outLong,
      scrollTrigger: { trigger: '.footer-base', start: 'top 92%', once: true },
    });

    // The seal used to rotate 90° across the footer's scroll. Chennai's whole
    // closing movement rests on the mark being the one thing that does not
    // perform — it "does not spin, draw, pulse or shimmer" — and a
    // scroll-linked logo rotation two sections later contradicts that for no
    // reason beyond decoration. It sits still now.
  });

  return (
    <footer ref={root} className="on-ink relative bg-paper">
      <div className="gutter overflow-hidden pt-20 md:pt-28">
        {/* Two up on a tablet, four only from `lg`. Four columns inside 768
              broke "59/31, 46th Street, Sarvamangala Colony" over five lines
              — an address that has to be read in one go. */}
          <div className="footer-cols grid gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          <div className="footer-col sm:col-span-2 lg:col-span-3">
            <Emblem tone="paper" sizes="76px" className="footer-seal w-19" />
            <p className="mt-6 max-w-[32ch] text-mist">{FOOTER.note}</p>
          </div>

          {LOCATIONS.map((loc) => (
            <div key={loc.slug} className="footer-col lg:col-span-3">
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
                className="mt-2 inline-block py-1.5 text-sm text-smoke underline underline-offset-4 transition-colors hover:text-ink"
              >
                Open in Maps
              </a>
              <p className="mt-2">
                <Link
                  href={`/${loc.slug}`}
                  className="inline-block py-1.5 text-bone transition-colors hover:text-ink"
                >
                  About this one
                </Link>
              </p>
            </div>
          ))}

          <nav aria-label="Footer" className="footer-col sm:col-span-2 lg:col-span-3">
            <h2 className="type-label mb-4">Reach us</h2>
            {/* A dead `tel:` link is worse than an absent one: it looks
                like a way to reach the hotel and is not. */}
            {CONTACT.phoneHref ? (
              <a
                href={CONTACT.phoneHref}
                className="tabular block text-bone transition-colors hover:text-ink"
              >
                {CONTACT.phone}
              </a>
            ) : (
              <p className="tabular block text-smoke">Telephone — {CONTACT.unset.toLowerCase()}</p>
            )}
            {CONTACT.email ? (
              <a
                href={`mailto:${CONTACT.email}`}
                className="mt-1 block text-bone transition-colors hover:text-ink"
              >
                {CONTACT.email}
              </a>
            ) : (
              <p className="mt-1 block text-smoke">Email — {CONTACT.unset.toLowerCase()}</p>
            )}
            <ul className="mt-4">
              {/* Straight off LOCATIONS now that NAV has gone. These were the
                  same two links written a second time; with the header down to
                  one button, this list and the homepage's two doors are how
                  anyone reaches a property, so it should not be able to fall
                  out of step with the properties themselves. */}
              {LOCATIONS.map((loc) => (
                <li key={loc.slug}>
                  <Link
                    href={`/${loc.slug}`}
                    className="inline-block py-1.5 text-bone transition-colors hover:text-ink"
                  >
                    {loc.shortName}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/*
          The small print, above the wordmark rather than under it: the word
          is now the last thing on the page and runs off its bottom edge, so
          nothing can follow it. Three groups — the copyright, the policies,
          the credit — in a row on a laptop and stacked below that.
        */}
        <div className="footer-base mt-16 flex flex-col gap-4 border-t border-hairline py-7 text-xs text-smoke md:mt-24 lg:flex-row lg:items-center lg:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {SITE.legalName}
          </p>
          <ul className="flex flex-wrap gap-x-6">
            {FOOTER.legal.map((item) => (
              <li key={item.href}>
                {/*
                  Not prefetched. These three pages do not exist yet, and in
                  production Next fetches every link in view — so each of them
                  fired a 404 in the console on every single page load, on
                  every page of the site. The links stay, because they are
                  where the policies will be; the speculative fetch for
                  something that is not there does not.
                */}
                <Link
                  href={item.href}
                  prefetch={false}
                  className="inline-block py-1.5 transition-colors hover:text-mist"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <p>
            {FOOTER.credit.prefix}{' '}
            <a
              href={FOOTER.credit.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block py-1.5 font-medium tracking-[0.08em] text-bone transition-colors hover:text-ink"
            >
              {FOOTER.credit.name}
            </a>
          </p>
        </div>

        {/*
          The wordmark, cropped by the bottom of the page.

          The word is set larger than the footer can hold and the box is cut
          a little below the bowl of the P — never at it, or the P and R close
          into D's and the word reads "VADD" — so the letters appear
          to continue below the screen — the page ends on the name rather than
          on a rule. Only the top of each letter is needed to read it: the
          serifs of the V, the apex of the A and the bowls of the P and R are
          all in the upper part.

          The box height is in `em` of the word's own size, so the crop lands
          at the same place on the letters at every width. The face runs from
          full white at the top to a slightly dimmer white at the cut, which
          is what keeps a flat white block from reading as a sticker.
        */}
        <div
          className="footer-wordmark relative mt-6 overflow-hidden text-[clamp(5.5rem,27vw,26rem)] md:mt-10"
          style={{ height: '0.6em' }}
          aria-hidden
        >
          <span
            className="type-display absolute inset-x-0 top-0 block text-center"
            style={{
              // Inline rather than utilities: `type-display` sets both, and
              // which of two utilities wins is stylesheet order, not intent.
              lineHeight: 1,
              letterSpacing: '-0.01em',
              marginTop: '0em',
              color: 'transparent',
              backgroundImage:
                'linear-gradient(to bottom, var(--color-ink) 25%, color-mix(in oklab, var(--color-ink) 86%, var(--color-paper)) 75%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
            }}
          >
            VAPR
          </span>
        </div>
      </div>
    </footer>
  );
}
