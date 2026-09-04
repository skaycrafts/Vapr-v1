'use client';

import { useRef } from 'react';
import Emblem from '@/components/brand/Emblem';
import { HERO, SITE } from '@/lib/content';
import { gsap } from '@/lib/gsap';
import { useMotionEffect, refreshScrollTriggers } from '@/motion/useMotionEffect';
import { useScroll } from '@/motion/ScrollProvider';
import { ENTRY, useEntry } from '@/motion/entry';
import { CINEMA, CONTENT, EASE, SCRUB } from '@/motion/config';

const LINES = HERO.statement.split('\n');

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const { started } = useEntry();
  const { scrollTo } = useScroll();

  /**
   * Entry. Scheduled against the moment the overture's field begins to lift,
   * so the headline is already rising while the black is still travelling —
   * the two read as one movement rather than a handover (§03).
   */
  useMotionEffect(
    root,
    () => {
      if (!started) return;

      // Offsets are relative to `lift`, which is when `started` fires.
      const at = (mark: number) => Math.max(0, mark - ENTRY.lift);

      const tl = gsap.timeline({ defaults: { ease: EASE.outLong } });

      tl
        // The city, first and smallest. The seal has just said VAPR; this
        // says where, before anything says what.
        .from('.hero-place', { opacity: 0, duration: CONTENT.slow }, at(ENTRY.headline) - 0.22)
        .from(
          '.hero-rule',
          { scaleX: 0, duration: CINEMA.base, ease: EASE.inOutHeavy },
          at(ENTRY.headline) - 0.1
        )
        // The two halves of the sentence arrive as two beats, not as one
        // staggered pair. `STAGGER.lines` is 0.08s — fast enough that the
        // reader sees a single block settle. A fifth of a second apart is
        // long enough to read as "a quiet floor" … "above a loud street",
        // which is the whole joke of the line and was being thrown away.
        .from('.hero-line-1 > span', { yPercent: 118, duration: CINEMA.fast }, at(ENTRY.headline))
        .from(
          '.hero-line-2 > span',
          { yPercent: 118, duration: CINEMA.fast },
          at(ENTRY.headline) + 0.2
        )
        .from('.hero-cue', { opacity: 0, duration: 0.8 }, at(ENTRY.cue));

      // The hero is the first pinned measurement on the page; remeasure once
      // the entrance has released the scroll and heights are final.
      refreshScrollTriggers();
    },
    [started]
  );

  /**
   * The mark settles out of a hair under full size as the entrance hands over,
   * and then drifts a little against the scroll — the same treatment the
   * photograph used to get, applied to the thing that replaced it.
   */
  useMotionEffect(
    root,
    () => {
      const el = root.current;
      if (!el || !started) return;

      gsap.from('.hero-mark', {
        opacity: 0,
        scale: 0.94,
        duration: CINEMA.epic,
        ease: EASE.outLong,
        delay: Math.max(0, ENTRY.headline - ENTRY.lift),
      });

      gsap.to('.hero-mark', {
        yPercent: 10,
        ease: EASE.none,
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: SCRUB.tight },
      });
    },
    [started]
  );

  /**
   * Depart. The frame dims and the copy drifts up as the next section takes
   * over, so the two overlap rather than butting against each other (§19).
   */
  useMotionEffect(root, () => {
    const el = root.current;
    if (!el) return;

    gsap.to('.hero-copy', {
      yPercent: -32,
      opacity: 0,
      ease: EASE.none,
      scrollTrigger: { trigger: el, start: 'top top', end: '70% top', scrub: SCRUB.tight },
    });

    // The indicator fills as the first viewport is consumed, then retires. It
    // never becomes a permanent progress bar across the page (§23).
    gsap.to('.hero-cue-fill', {
      scaleY: 1,
      ease: EASE.none,
      scrollTrigger: { trigger: el, start: 'top top', end: '55% top', scrub: SCRUB.tight },
    });
  });

  return (
    <section
      ref={root}
      id="top"
      className="relative h-[100svh] min-h-[34rem] w-full overflow-hidden bg-void"
    >
      {/*
        The mark, where the building used to be.

        The hero was a full-bleed photograph of the Ashok Nagar facade with a
        WebGL layer dissolving between three stills on top of it. Both are
        gone: the opening is typographic now, and the emblem is the only thing
        in the upper two-thirds of the frame.

        It sits above the copy rather than behind it — no scrim, because there
        is nothing to scrim. The type is on plain void and reads at the same
        contrast as the rest of the site.

        Placed a little above centre in the space left over the copy block, so
        the composition is weighted the way the page reads: mark, rule,
        sentence, addresses.
      */}
      <div className="pointer-events-none absolute inset-x-0 top-[9svh] flex h-[50svh] items-center justify-center md:top-[10svh] md:h-[46svh]">
        <Emblem
          priority
          sizes="(min-width: 768px) 380px, 62vw"
          className="hero-mark w-[min(62vw,23.75rem)]"
        />
      </div>

      <div className="hero-copy gutter absolute inset-x-0 bottom-0 pb-9 md:pb-12">
        <p className="hero-place type-label mb-4 text-chalk/80">{SITE.city}</p>

        <div className="hero-rule mb-7 h-px w-full origin-left bg-hairline-strong md:mb-9" />

        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:gap-16">
          {/*
            One sentence, two voices. The roman states the fact and the italic
            answers it — the contrast the display family already contains, and
            the only place on the site it is spent. Both halves still rise out
            of their own clipping mask, a fifth of a second apart, so the line
            arrives the way it reads.
          */}
          <h1 className="type-display max-w-[16ch] text-[clamp(2.25rem,6.4vw,5.25rem)] text-chalk">
            <span className="hero-line-1 split-mask">
              <span className="block" style={{ willChange: 'transform' }}>
                {LINES[0]}
              </span>
            </span>
            <span className="hero-line-2 split-mask">
              <span className="block italic">{LINES[1]}</span>
            </span>
          </h1>

          {/* The two addresses used to sit above this, as an eyebrow and a
              line of areas. They have gone: the hero already names the city
              over the rule, and the section directly beneath it is the
              property chooser, which says both names at the size they deserve.
              Saying them here as well made the frame's one quiet corner into a
              second caption. */}
          <div className="flex shrink-0 items-end justify-end">
            <a
              href="#chennai"
              className="hero-cue group flex items-center gap-3 text-mist transition-colors duration-300 hover:text-chalk"
              onClick={(e) => {
                e.preventDefault();
                scrollTo('#chennai');
              }}
            >
              <span className="type-label text-inherit">{HERO.scrollCue}</span>
              {/* A rail that fills as the hero is consumed, rather than a
                  looping arrow that keeps asking after you have answered. */}
              <span aria-hidden className="relative block h-10 w-px overflow-hidden bg-hairline">
                {/*
                  Tailwind's `scale-*` utilities compile to the standalone CSS
                  `scale` property in v4, which multiplies against `transform`
                  rather than replacing it. GSAP animates `transform`, so a
                  `scale-y-0` class here pinned the rendered size at zero
                  forever: this rail has never actually filled. The rest state
                  is an inline transform now, on the same property GSAP drives.
                */}
                <span
                  className="hero-cue-fill absolute inset-x-0 top-0 h-full origin-top bg-chalk"
                  style={{ transform: 'scaleY(0)' }}
                />
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
