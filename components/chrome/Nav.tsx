'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Emblem from '@/components/brand/Emblem';
import Glass from '@/components/ui/Glass';
import Magnetic from '@/motion/primitives/Magnetic';
import { CONTACT, CTA, NAV } from '@/lib/content';
import { cn } from '@/lib/utils';
import { gsap } from '@/lib/gsap';
import { useCapability } from '@/motion/capability';
import { useMotionEffect } from '@/motion/useMotionEffect';
import { useScroll } from '@/motion/ScrollProvider';
import { CINEMA, EASE, MICRO, STAGGER } from '@/motion/config';

/**
 * Deliberately not a full-width bar. The seal anchors the top-left corner and
 * the links ride in a glass pill on the right, so the photography runs edge to
 * edge underneath instead of being cropped by a header.
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
  const overlay = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { animate } = useCapability();
  const { scrollTo, stop, start } = useScroll();

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

  /** The overlay is a modal surface: lock the page and let Escape close it. */
  useEffect(() => {
    if (!open) return;
    stop();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      start();
    };
  }, [open, stop, start]);

  /** Menu items arrive one after another rather than all at once (§25). */
  useMotionEffect(
    overlay,
    ({ q }) => {
      if (!open) return;
      const items = q('.menu-item');
      if (!items.length) return;

      gsap
        .timeline({ defaults: { ease: EASE.outLong } })
        .from(overlay.current, { opacity: 0, duration: MICRO.base, ease: EASE.outSoft })
        .from(items, { yPercent: 105, duration: CINEMA.fast, stagger: STAGGER.lines }, 0.05);
    },
    [open]
  );

  /**
   * Links are real hrefs, so a route change is Next's job. Only a hash that
   * points at the page we are already on is intercepted, and then only to hand
   * it to the scroll provider for the glide.
   */
  const handle = (href: string) => (event: React.MouseEvent) => {
    const [path, hash] = href.split('#');
    const samePage = (path || '/') === pathname;
    if (!hash || !samePage) {
      setOpen(false);
      return; // let Next navigate
    }

    const target = document.getElementById(hash);
    if (!target) {
      setOpen(false);
      return;
    }

    event.preventDefault();
    setOpen(false);
    scrollTo(target);
  };

  return (
    <>
      <a
        href="#main"
        className="sr-only-focusable focus-visible:gutter focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-[var(--z-modal)] focus-visible:m-0 focus-visible:h-auto focus-visible:w-auto focus-visible:overflow-visible focus-visible:whitespace-normal focus-visible:bg-chalk focus-visible:py-3 focus-visible:text-void focus-visible:[clip-path:none]"
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
            !open &&
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
              'linear-gradient(to bottom, color-mix(in oklab, var(--color-void) 72%, transparent), transparent)',
          }}
        />

        <div className="gutter relative flex items-center justify-between py-5 md:py-7">
          <Link href="/" data-cursor="Open" className="group flex items-center gap-3 text-chalk">
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

          <nav aria-label="Primary" className="hidden md:block">
            <Glass className="flex items-center gap-1 rounded-full px-2 py-2" radius={999}>
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handle(item.href)}
                  aria-current={pathname === item.href ? 'page' : undefined}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm transition-colors duration-300 hover:text-chalk focus-visible:text-chalk',
                    pathname === item.href ? 'text-chalk' : 'text-mist'
                  )}
                >
                  {item.label}
                </Link>
              ))}
              {/* The one magnetic control on the site. It marks the single
                  thing the page is asking anyone to do; used twice it would
                  mark nothing. */}
              <Magnetic className="ml-1">
                <Link
                  href={CTA.href}
                  onClick={handle(CTA.href)}
                  data-cursor="Open"
                  className="block rounded-full bg-chalk px-5 py-2 text-sm font-medium text-void transition-[background-color] duration-300 hover:bg-bone active:scale-[0.97]"
                >
                  {CTA.label}
                </Link>
              </Magnetic>
            </Glass>
          </nav>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="menu-overlay"
            className="flex items-center gap-2 text-chalk md:hidden"
          >
            <span className="type-label text-chalk">Menu</span>
            <Menu size={20} strokeWidth={1.25} aria-hidden />
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        ref={overlay}
        id="menu-overlay"
        hidden={!open}
        className="fixed inset-0 z-[var(--z-modal)] bg-void/97 md:hidden"
      >
        <div className="gutter flex h-full flex-col">
          <div className="flex items-center justify-between py-5">
            {/* The overlay covers the header, so this is standing in for the
                header's mark — it should be the mark. */}
            <Emblem sizes="44px" className="w-11" />
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
              <X size={22} strokeWidth={1.25} className="text-chalk" aria-hidden />
            </button>
          </div>

          <nav aria-label="Primary, mobile" className="flex flex-1 flex-col justify-center gap-1">
            {[...NAV, CTA].map((item) => (
              <span key={item.href} className="split-mask hairline-b">
                <Link
                  href={item.href}
                  onClick={handle(item.href)}
                  className="menu-item type-display block py-5 text-4xl text-chalk"
                >
                  {'label' in item ? item.label : ''}
                </Link>
              </span>
            ))}
          </nav>

          <div className="flex items-center justify-between py-8">
            {CONTACT.phoneHref ? (
              <a href={CONTACT.phoneHref} className="text-sm text-mist">
                {CONTACT.phone}
              </a>
            ) : (
              <span className="text-sm text-ash">{CONTACT.unset}</span>
            )}
            <Emblem sizes="56px" className="w-14 opacity-45" />
          </div>
        </div>
      </div>

      {/* Without motion the overlay must still be usable the instant it opens;
          the timeline above is what would otherwise reveal the items. */}
      {!animate && open ? (
        <style>{`.menu-item { transform: none !important; }`}</style>
      ) : null}
    </>
  );
}
