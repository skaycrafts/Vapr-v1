'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Frame from '@/components/media/Frame';
import { HERO, needsVerification } from '@/lib/content';
import { gsap, ScrollTrigger, useIsoLayoutEffect } from '@/lib/gsap';
import { useCapability } from '@/lib/useCapability';
import { useIntro } from '@/components/providers/Intro';

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
  const { webgl, ready } = useCapability();
  const { ready: introDone } = useIntro();
  // Set if the GPU drops the context or a texture fails; the photograph
  // underneath is already on screen, so the canvas simply stops painting.
  const [shaderFailed, setShaderFailed] = useState(false);

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Entry. The `from` state is set by script, so the copy is legible even
      // if this never runs.
      if (!reduce) {
        gsap
          .timeline({ paused: true, defaults: { ease: 'expo.out' } })
          .from('.hero-line > span', { yPercent: 118, duration: 1.25, stagger: 0.11 })
          .from('.hero-rule', { scaleX: 0, duration: 1.4, ease: 'expo.inOut' }, 0.15)
          .from('.hero-meta', { opacity: 0, y: 14, duration: 1, stagger: 0.08 }, 0.5)
          .play();
      }

      // Depart. The frame drifts up and dims as the manifesto takes over,
      // so the two sections overlap rather than butt against each other.
      if (!reduce) {
        gsap.to('.hero-veil', {
          opacity: 1,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
        });
        gsap.to('.hero-copy', {
          yPercent: -32,
          opacity: 0,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top top', end: '70% top', scrub: true },
        });
      }
    }, el);

    return () => ctx.revert();
  }, [introDone]);

  useIsoLayoutEffect(() => {
    // The hero is the first pinned measurement on the page; recompute once
    // the entry sequence has released the scroll.
    if (introDone) ScrollTrigger.refresh();
  }, [introDone]);

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
        className="absolute inset-0 h-full w-full"
        imgClassName="scale-[1.02]"
        ratio="fill"
        crossOrigin="anonymous"
        sizes="100vw"
        priority
        position="50% 42%"
      />

      {ready && webgl && !shaderFailed ? (
        <div className="absolute inset-0">
          <HeroCanvas
            sources={SEQUENCE}
            intro={introDone}
            onFail={() => setShaderFailed(true)}
          />
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
            <div className="hero-meta text-right">
              <p className="type-label">{HERO.place}</p>
              <p className="tabular mt-1 text-sm text-mist">
                {needsVerification.coordinates.lat.toFixed(4)}&thinsp;N&nbsp;&nbsp;
                {needsVerification.coordinates.lng.toFixed(4)}&thinsp;E
              </p>
            </div>

            <a
              href="#manifesto"
              className="hero-meta group flex items-center gap-3 text-mist transition-colors hover:text-chalk"
              onClick={(e) => {
                e.preventDefault();
                const target = document.querySelector<HTMLElement>('#manifesto');
                if (!target) return;
                if (window.__lenis) window.__lenis.scrollTo(target, { duration: 1.4 });
                else target.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span className="type-label text-inherit">{HERO.scrollCue}</span>
              <span aria-hidden className="relative block h-10 w-px overflow-hidden bg-hairline">
                <span className="absolute inset-x-0 top-0 h-1/2 bg-chalk motion-safe:animate-[cue_2.4s_var(--ease-in-out-quint)_infinite]" />
              </span>
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cue {
          0%   { transform: translateY(-100%); }
          55%  { transform: translateY(100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </section>
  );
}
