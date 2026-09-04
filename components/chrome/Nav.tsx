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
  const [hidden, setHidden] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { animate } = useCapability();
  const { scrollTo, stop, start } = useScroll();

  const lastY = useRef(0);
  // Suspends the retract rule: a scroll the navigation started itself should
  // not make the navigation disappear.
  const holding = useRef(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Two rules on one listener.
   *
   * Retract, as before: the bar leaves on the way down and returns on the way
   * up. It reads the native scroll position, which Lenis keeps authoritative —
   * it smooths the scroll, it does not virtualise it.
   *
   * And the new one: the bar does not exist over the opening section at all.
   * It is measured against the first section on the page rather than against a
   * fixed number of pixels, so it works for the homepage's full-height hero
   * and a property page's shorter one without either being special-cased.
   * Re-measured on resize, because a phone's address bar sliding away changes
   * the answer.
   */
  useEffect(() => {
    let heroBottom = window.innerHeight;

    const measure = () => {
      const hero = document.querySelector<HTMLElement>('main section');
      // A little before the hero's own foot, so the bar is already in place by
      // the time the next section has properly arrived.
      heroBottom = hero ? hero.offsetTop + hero.offsetHeight - 96 : window.innerHeight;
    };

    const onScroll = () => {
      const y = window.scrollY;
      setPastHero(y >= heroBottom);

      const delta = y - lastY.current;
      if (Math.abs(delta) > 6) {
        lastY.current = y;
        if (holding.current) return;
        /*
         * The retract threshold is measured from the hero, not from a fixed
         * 260px, and that is not a tidy-up — it is what lets the bar arrive at
         * all.
         *
         * The two rules used to collide. Anyone scrolling down through the
         * hero was already past 260px and still descending, so `hidden` was
         * true long before the opacity gate opened: the bar crossed into view
         * fully transparent *and* translated off the top, and only appeared if
         * the visitor happened to scroll back up. A navigation that arrives
         * after the hero has to survive the scroll that got it there.
         *
         * So retract cannot engage until 400px past the point the bar appears,
         * which gives it a clear arrival and then hands it back to the
         * ordinary leaves-on-the-way-down behaviour.
         */
        setHidden(y > heroBottom + 400 && delta > 0);
      }
    };

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
      if (holdTimer.current) clearTimeout(holdTimer.current);
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
    setHidden(false);
    holding.current = true;
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      holding.current = false;
    }, 1700);

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
          'fixed inset-x-0 top-0 z-[var(--z-nav)] transition-[transform,opacity] duration-500 ease-[var(--ease-out-quart)]',
          hidden && !open && '-translate-y-[130%]',
          /*
           * Held back over the opening section — the mark and the links both.
           * The hero is a single composition now and the bar was sitting on
           * top of it; it arrives when the hero has gone.
           *
           * Opacity and pointer-events rather than `visibility` or unmounting,
           * so the links stay in the tab order and in the accessibility tree.
           * `focus-within` then brings the bar back the instant a keyboard
           * reaches it, which is what stops this from being a navigation that
           * sighted keyboard users cannot see themselves entering. A screen
           * reader was never going to be troubled by it either way.
           */
          !pastHero &&
            !open &&
            'pointer-events-none opacity-0 focus-within:pointer-events-auto focus-within:opacity-100'
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
