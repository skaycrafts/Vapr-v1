'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Frame from '@/components/media/Frame';
import { HERO, LOCATIONS } from '@/lib/content';
import { gsap } from '@/lib/gsap';
import { useCapability } from '@/motion/capability';
import { useMotionEffect, refreshScrollTriggers } from '@/motion/useMotionEffect';
import { useScroll } from '@/motion/ScrollProvider';
import { ENTRY, useEntry } from '@/motion/entry';
import { CINEMA, EASE, SCRUB, STAGGER } from '@/motion/config';

// Lazily loaded and never server-rendered: the shader must not sit on the
// critical path, and the photograph underneath is what carries the LCP (§28).
const HeroCanvas = dynamic(() => import('@/components/webgl/HeroCanvas'), { ssr: false });

/**
 * The stills the shader dissolves between. Pinned to the 1600 rendition so the
 * first one is usually already in cache from the base `<Frame>` underneath.
 */
const SEQUENCE = [
  '/media/img/facade-dusk-1600.avif',
  '/media/img/lift-stone-1600.avif',
  '/media/img/sky-cutout-1600.avif',
];

const LINES = HERO.statement.split('\n');

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const { animate, ready } = useCapability();
  const { started } = useEntry();
  const { scrollTo } = useScroll();
  // Set if the GPU drops the context or a texture fails; the photograph
  // underneath is already on screen, so the canvas simply stops painting.
  const [shaderFailed, setShaderFailed] = useState(false);

  const webgl = ready && animate && !shaderFailed;

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

      tl.from(
        '.hero-line > span',
        { yPercent: 118, duration: CINEMA.fast, stagger: STAGGER.lines },
        at(ENTRY.headline)
      )
        .from(
          '.hero-rule',
          { scaleX: 0, duration: CINEMA.base, ease: EASE.inOutHeavy },
          at(ENTRY.headline)
        )
        .from(
          '.hero-meta',
          { opacity: 0, y: 14, duration: CINEMA.fast, stagger: STAGGER.items },
          at(ENTRY.nav)
        )
        .from('.hero-cue', { opacity: 0, duration: 0.8 }, at(ENTRY.cue));

      // The hero is the first pinned measurement on the page; remeasure once
      // the entrance has released the scroll and heights are final.
      refreshScrollTriggers();
    },
    [started]
  );

  /**
   * The photograph settles out of a slight over-scale across the first
   * viewport, then drifts against the scroll. Both are deliberately below the
   * threshold of notice: if the visitor sees the image moving, it is too much.
   *
   * Only applied when the shader is absent — the canvas runs the equivalent
   * settle in its own `uIntro` uniform, and doing both double-scales the frame.
   */
  useMotionEffect(
    root,
    () => {
      const el = root.current;
      if (!el || webgl) return;

      gsap.fromTo(
        '.hero-plate',
        { scale: 1.05 },
        { scale: 1, duration: CINEMA.epic * 1.6, ease: EASE.outLong }
      );

      gsap.to('.hero-plate', {
        yPercent: 8,
        ease: EASE.none,
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: SCRUB.tight },
      });
    },
    [webgl]
  );

  /**
   * Depart. The frame dims and the copy drifts up as the next section takes
   * over, so the two overlap rather than butting against each other (§19).
   */
  useMotionEffect(root, () => {
    const el = root.current;
    if (!el) return;

    gsap.to('.hero-veil', {
      opacity: 1,
      ease: EASE.none,
      scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: SCRUB.tight },
    });

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
      {/* The photograph is the floor, not the fallback: it always renders, and
          carries the LCP. The shader layers on top and is free to fail. */}
      <Frame
        slug="facade-dusk"
        className="hero-plate absolute inset-0 h-full w-full"
        ratio="fill"
        crossOrigin="anonymous"
        sizes="100vw"
        priority
        position="50% 42%"
      />

      {webgl ? (
        <div className="absolute inset-0">
          <HeroCanvas sources={SEQUENCE} intro={started} onFail={() => setShaderFailed(true)} />
        </div>
      ) : null}

      {/* Legibility scrim — heavier at the foot, where the copy sits. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, color-mix(in oklab, var(--color-void) 46%, transparent) 0%, transparent 26%, transparent 48%, color-mix(in oklab, var(--color-void) 82%, transparent) 100%)',
        }}
      />
      <div className="hero-veil pointer-events-none absolute inset-0 bg-void opacity-0" aria-hidden />

      <div className="hero-copy gutter absolute inset-x-0 bottom-0 pb-9 md:pb-12">
        <div className="hero-rule mb-7 h-px w-full origin-left bg-hairline-strong md:mb-9" />

        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:gap-16">
          <h1 className="type-display max-w-[16ch] text-[clamp(2.25rem,6.4vw,5.25rem)] text-chalk">
            {LINES.map((line, i) => (
              <span key={line} className="hero-line split-mask">
                <span className="block" style={{ willChange: i === 0 ? 'transform' : undefined }}>
                  {line}
                </span>
              </span>
            ))}
          </h1>

          <div className="flex shrink-0 items-end justify-between gap-10 md:flex-col md:items-end md:gap-6">
            {/* Right-aligned only where it is actually on the right. On a
                phone this block sits at the left of a justify-between row, and
                ragging it right left the two lines floating against nothing. */}
            <div className="hero-meta md:text-right">
              <p className="type-label">{HERO.place}</p>
              <p className="mt-1 text-sm text-mist">
                {LOCATIONS.map((l) => l.area).join(' · ')}
              </p>
            </div>

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
                <span className="hero-cue-fill absolute inset-x-0 top-0 h-full origin-top scale-y-0 bg-chalk" />
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
