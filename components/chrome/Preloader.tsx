'use client';

import { useRef, useState } from 'react';
import Emblem from '@/components/brand/Emblem';
import { gsap, useIsoLayoutEffect } from '@/lib/gsap';
import { introAlreadySeen, markIntroSeen, useIntro } from '@/components/providers/Intro';

/**
 * The entry sequence: the seal draws itself line by line, a counter runs to
 * 100, and then the black field lifts off the top of the hero.
 *
 * It is an overlay, not a gate — the page is fully rendered underneath the
 * whole time, so a crawler, a reader with scripting off, or a failed animation
 * all still get the site. `prefers-reduced-motion` collapses it to a fade.
 *
 * It is rendered unconditionally, on the server as well as the client, and
 * decides for itself whether to play. Deciding in the parent instead meant the
 * server emitted this overlay while the client decided not to render it, and
 * the orphaned node stayed on screen covering the whole page on every
 * navigation after the first. The inline script in the document head hides it
 * before first paint on a repeat visit, so skipping costs no flash.
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

    // Already played this session: dismiss without animating.
    if (introAlreadySeen()) {
      setGone(true);
      finish();
      return;
    }
    markIntroSeen();

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lenis = window.__lenis;
    lenis?.stop();
    window.scrollTo(0, 0);

    const ctx = gsap.context(() => {
      const strokes = gsap.utils.toArray<SVGGeometryElement>('.emblem-line *');

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
          .set('.emblem-word', { opacity: 1 })
          .set(counter.current, { textContent: '100' })
          .to(el, { autoAlpha: 0, duration: 0.35 }, '+=0.2');
        return;
      }

      const count = { value: 0 };

      tl.to(strokes, {
        strokeDashoffset: 0,
        duration: 1.15,
        stagger: { each: 0.012, from: 'center' },
        ease: 'power1.inOut',
      })
        .to('.emblem-word', { opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.45')
        .to(
          count,
          {
            value: 100,
            duration: 1.5,
            ease: 'power1.inOut',
            onUpdate: () => {
              if (counter.current) {
                counter.current.textContent = String(Math.round(count.value)).padStart(3, '0');
              }
            },
          },
          0
        )
        .to('.preloader-seal', { scale: 1.18, duration: 0.9, ease: 'power3.inOut' }, '-=0.25')
        .to('.preloader-seal', { autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, '-=0.55')
        .to('.preloader-meta', { autoAlpha: 0, duration: 0.4 }, '<')
        .to(el, { yPercent: -100, duration: 1.05, ease: 'expo.inOut' }, '-=0.2');
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
      <div className="preloader-seal w-[min(46vw,17rem)] text-chalk">
        <Emblem animated variant="full" />
      </div>

      <div className="preloader-meta gutter absolute inset-x-0 bottom-8 flex items-end justify-between">
        <span className="type-label">VAPR</span>
        <span
          ref={counter}
          className="tabular type-wide text-[clamp(2rem,7vw,4rem)] leading-none text-chalk"
        >
          000
        </span>
      </div>

      <style>{`
        .emblem-word { opacity: 0; }
      `}</style>
    </div>
  );
}
