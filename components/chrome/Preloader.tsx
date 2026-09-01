'use client';

import { useRef, useState } from 'react';
import Emblem from '@/components/brand/Emblem';
import { gsap, useIsoLayoutEffect } from '@/lib/gsap';
import { useIntro } from '@/components/providers/Intro';

/**
 * The entry sequence, in two beats: the seal draws itself line by line, and
 * then the wordmark rises into place beneath it. A counter runs alongside, and
 * the black field lifts off the top of the hero.
 *
 * The wordmark sits under the seal rather than inside its diamond, where it
 * was too small to read at any sensible size for the mark.
 *
 * It is an overlay, not a gate — the page is fully rendered underneath the
 * whole time, so a crawler, a reader with scripting off, or a failed animation
 * all still get the site. `prefers-reduced-motion` collapses it to a fade.
 *
 * It lives in the root layout, so it mounts once per page load: it plays on
 * every refresh, and never interrupts navigation between routes.
 */
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  const [gone, setGone] = useState(false);
  const { finish } = useIntro();

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el || started.current) return;
    started.current = true;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lenis = window.__lenis;
    lenis?.stop();
    window.scrollTo(0, 0);

    const ctx = gsap.context(() => {
      // Geometry only. `.emblem-line *` also matches the <g> wrappers, which
      // draw nothing but still consume stagger slots and stretched the
      // sequence well past the point the wordmark was meant to arrive.
      const strokes = gsap.utils.toArray<SVGGeometryElement>(
        '.emblem-line path, .emblem-line circle, .emblem-line line'
      );

      // Seed each path's dash pattern from its own length so they all draw at
      // a comparable rate rather than snapping in together.
      strokes.forEach((node) => {
        const len = typeof node.getTotalLength === 'function' ? node.getTotalLength() : 0;
        if (!len) return;
        gsap.set(node, { strokeDasharray: len, strokeDashoffset: len });
      });

      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        onComplete: () => {
          setGone(true);
          finish();
          lenis?.start();
        },
      });

      if (reduce) {
        tl.set(strokes, { strokeDashoffset: 0 })
          .set('.preloader-word > span', { yPercent: 0 })
          .set(counter.current, { textContent: '100' })
          .to(el, { autoAlpha: 0, duration: 0.35 }, '+=0.25');
        return;
      }

      const count = { value: 0 };

      // Absolute positions rather than relative offsets: the draw's length
      // depends on how many strokes the seal has, and chaining off it left
      // the wordmark arriving just as the field lifted.
      tl
        // 1 — the seal draws itself.
        .to(
          strokes,
          {
            strokeDashoffset: 0,
            duration: 1,
            stagger: { each: 0.007, from: 'center' },
            ease: 'power1.inOut',
          },
          0
        )
        // 2 — the wordmark rises into place beneath it, and holds.
        .from('.preloader-word > span', { yPercent: 115, duration: 0.85, ease: 'expo.out' }, 1.05)
        .to(
          count,
          {
            value: 100,
            duration: 1.8,
            ease: 'power1.inOut',
            onUpdate: () => {
              if (counter.current) {
                counter.current.textContent = String(Math.round(count.value)).padStart(3, '0');
              }
            },
          },
          0
        )
        // 3 — the lockup grows past the frame and the field lifts behind it.
        .to('.preloader-lockup', { scale: 1.12, duration: 0.85, ease: 'power3.inOut' }, 2.5)
        .to('.preloader-lockup', { autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, 2.85)
        .to('.preloader-meta', { autoAlpha: 0, duration: 0.4 }, 2.85)
        .to(el, { yPercent: -100, duration: 1, ease: 'expo.inOut' }, 3.1);
    }, el);

    return () => {
      ctx.revert();
      lenis?.start();
    };
  }, [finish]);

  if (gone) return null;

  return (
    <div
      ref={root}
      data-preloader
      className="fixed inset-0 z-[var(--z-preloader)] flex items-center justify-center bg-void"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="preloader-lockup flex flex-col items-center">
        <Emblem animated variant="mark" className="w-[min(36vw,13rem)] text-chalk" />

        <div className="preloader-word split-mask mt-7 md:mt-9">
          {/*
            Letter-spacing is applied after the final R too, so the box carries
            one trailing space the glyphs do not. Centring the box therefore
            pushes the visible word half a space left of the seal above it.
            An equal indent on the left restores true optical centring.
          */}
          <span className="type-display block pl-[0.42em] text-[clamp(1.75rem,5vw,3rem)] leading-[1.15] tracking-[0.42em] text-chalk">
            VAPR
          </span>
        </div>
      </div>

      <div className="preloader-meta gutter absolute inset-x-0 bottom-8 flex items-end justify-between">
        <span className="type-label">Chennai</span>
        <span
          ref={counter}
          className="tabular type-wide text-[clamp(2rem,7vw,4rem)] leading-none text-chalk"
        >
          000
        </span>
      </div>
    </div>
  );
}
