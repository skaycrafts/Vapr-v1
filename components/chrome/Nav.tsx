'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Emblem from '@/components/brand/Emblem';
import Magnetic from '@/motion/primitives/Magnetic';
import { CTA } from '@/lib/content';
import { cn } from '@/lib/utils';
import { gsap } from '@/lib/gsap';
import { useMotionEffect } from '@/motion/useMotionEffect';
import { useScroll } from '@/motion/ScrollProvider';
import { EASE } from '@/motion/config';

/**
 * Deliberately not a full-width bar. The seal anchors the top-left corner and
 * one button sits on the right, so the photography runs edge to edge
 * underneath instead of being cropped by a header.
 *
 * Two behaviours, and they are separate on purpose (§18):
 *
 *  Retract — the bar leaves on the way down and returns on the way up. The
 *            reading direction gets the full viewport, and the moment you look
 *            for navigation it is already there.
 *  Morph   — over the hero the bar is pure overlay, because the photograph
 *            behind it is doing the work. Past the hero a very quiet contrast
 *            layer fades in behind it, so the links stay legible against
 *            whatever section happens to be underneath without ever becoming
 *            an opaque header.
 */
export default function Nav() {
  const root = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);
  const { scrollTo } = useScroll();

  /**
   * The bar is not on the opening frame. It arrives once the scroll cue has
   * gone, and then it stays.
   *
   * ── Why one rule and not two ────────────────────────────────────────────
   * There used to be a retract as well: the bar left on the way down and came
   * back on the way up. Held against a hero it cannot appear over, the two
   * rules cancelled — anyone scrolling down through the hero was still
   * descending at the moment the gate opened, so the bar arrived and retracted
   * on the same gesture and was only ever seen by someone who happened to
   * scroll back up. Widening the retract threshold papered over it. Removing
   * the retract answers it: the bar has one state change in its life, which is
   * also what the reference this was modelled on does.
   *
   * ── Where it arrives ────────────────────────────────────────────────────
   * At 78% of the opening section. The hero's copy — the sentence, the rule,
   * the cue — is scrubbed to nothing by 70% of its own height, so this lands
   * just after the word SCROLL has faded rather than on top of it, and there
   * is a beat of empty frame between the two. Measured against the section
   * rather than a pixel count, so the homepage's full-height hero and a
   * property page's shorter one both work, and re-measured whenever the fonts
   * or the viewport change the answer.
   */
  useEffect(() => {
    let revealAt = window.innerHeight * 0.78;

    const measure = () => {
      const hero = document.querySelector<HTMLElement>('main section');
      revealAt = hero
        ? hero.offsetTop + hero.offsetHeight * 0.78
        : window.innerHeight * 0.78;
    };

    const onScroll = () => setRevealed(window.scrollY >= revealAt);

    measure();
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    // Fonts and imagery both change the hero's height after first paint.
    document.fonts?.ready.then(measure).catch(() => {});
    window.addEventListener('load', measure);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      window.removeEventListener('load', measure);
    };
  }, []);

  /**
   * Morph. A single scrub across the first viewport rather than a class
   * toggled at a threshold, so the layer arrives with the scroll instead of
   * snapping on at one pixel.
   */
  useMotionEffect(root, () => {
    gsap.fromTo(
      '.nav-backdrop',
      { opacity: 0 },
      {
        opacity: 1,
        ease: EASE.none,
        scrollTrigger: {
          trigger: document.documentElement,
          start: '60vh top',
          end: '110vh top',
          scrub: true,
        },
      }
    );
  });

  /**
   * Links are real hrefs, so a route change is Next's job. Only a hash that
   * points at the page we are already on is intercepted, and then only to hand
   * it to the scroll provider for the glide.
   */
  /**
   * The enquiry is on three pages, not one.
   *
   * `CTA.href` is `/#reserve`, and matching the path before honouring the hash
   * — which is what this used to do — meant a guest reading about Ashok Nagar
   * who pressed Book now was thrown back to the homepage to fill in a form
   * that page already had, losing the property the form would have known.
   *
   * So the hash wins wherever it resolves: if this page has a `#reserve`, that
   * is the one you get. The href stays a real, correct URL for every page that
   * does not — the footer's legal pages, a 404 — and Next navigates there.
   */
  const handle = (href: string) => (event: React.MouseEvent) => {
    const hash = href.split('#')[1];
    if (!hash) return;

    const target = document.getElementById(hash);
    if (!target) return; // not on this page — let Next navigate

    event.preventDefault();
    scrollTo(target);
  };

  return (
    <>
      <a
        href="#main"
        className="sr-only-focusable focus-visible:gutter focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-[var(--z-modal)] focus-visible:m-0 focus-visible:h-auto focus-visible:w-auto focus-visible:overflow-visible focus-visible:whitespace-normal focus-visible:bg-ink focus-visible:py-3 focus-visible:text-paper focus-visible:[clip-path:none]"
      >
        Skip to content
      </a>

      <header
        ref={root}
        className={cn(
          'fixed inset-x-0 top-0 z-[var(--z-nav)] transition-transform duration-700 ease-[var(--ease-out-quart)]',
          /*
           * Slid up out of the frame rather than faded out.
           *
           * A bar that fades is a bar that is present and dim; one that is
           * parked above the top edge and comes down has somewhere to arrive
           * from, which is the whole gesture. It is also what the reference
           * does — opacity stays at 1 throughout and only the transform moves.
           *
           * Transform rather than `visibility` or unmounting keeps the links
           * in the tab order and in the accessibility tree, and `focus-within`
           * brings the bar down the instant a keyboard reaches it — otherwise
           * this is navigation a sighted keyboard user can enter but not see.
           */
          !revealed &&
            'pointer-events-none -translate-y-full focus-within:pointer-events-auto focus-within:translate-y-0'
        )}
      >
        {/* The contrast layer. A gradient rather than a filled bar: it gives
            the type something to sit on without drawing an edge across the
            photography. */}
        <div
          aria-hidden
          className="nav-backdrop pointer-events-none absolute inset-x-0 top-0 h-[130%] opacity-0"
          style={{
            background:
              'linear-gradient(to bottom, color-mix(in oklab, var(--color-paper) 72%, transparent), transparent)',
          }}
        />

        <div className="gutter relative flex items-center justify-between py-5 md:py-7">
          <Link href="/" data-cursor="Open" className="group flex items-center gap-3 text-ink">
            {/*
              The emblem alone. It used to be a small mark beside the word
              VAPR set in display type — but the seal carries its own wordmark
              inside it, so the header was saying the name twice and showing
              the identity once, badly.

              Sized to be read as an insignia rather than a favicon: 44px on a
              phone, 52px from tablet up. Large enough that the ring, the
              diamond and the ornament resolve; small enough that it sits in
              the bar rather than owning it. It holds still on hover — the
              restraint the rest of the site's hover states keep (§21) — and
              only lifts a little in opacity.
            */}
            {/*
              Full opacity, deliberately. Rendered at 90% over the hero
              photograph the hairlines dropped into the foliage behind them and
              the mark read as a smudge rather than as a seal — the ink in this
              artwork is 2% of its own area, so it has no contrast to spare.

              48px on a phone, 56px from tablet up. Tested against the file at
              3x: below about 44px the wordmark inside the ring stops resolving
              and the ornament collapses into grey. This is the smallest the
              mark can be set and still be read as one.
            */}
            <Emblem
              title="VAPR"
              priority
              sizes="(min-width: 768px) 56px, 48px"
              className="w-12 md:w-14"
            />
          </Link>

          {/*
            One control, on every width.

            There was a glass pill here holding two links and the enquiry
            button, and a Menu button beside it that opened a full-screen
            overlay on a phone. Both have gone. The pill existed to group
            several things; with one thing in it, it was a border drawn round a
            button. The overlay existed to hold the same two links a thumb
            could not otherwise reach, and those links are on the homepage as
            two large buttons and in the footer with their addresses.

            What is left is the mark and the one thing the page is asking
            anyone to do — which is also why the magnetic treatment still
            belongs on it. It was the single magnetic control on the site when
            it sat among other links, and it is more obviously that now.
          */}
          <Magnetic>
            <Link
              href={CTA.href}
              onClick={handle(CTA.href)}
              data-cursor="Open"
              className="block rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-[background-color] duration-300 hover:bg-bone active:scale-[0.97] md:px-6"
            >
              {CTA.label}
            </Link>
          </Magnetic>
        </div>
      </header>

    </>
  );
}
