'use client';

import { useRef } from 'react';
import SplitType from 'split-type';
import Emblem from '@/components/brand/Emblem';
import { MANIFESTO } from '@/lib/content';
import { gsap, useIsoLayoutEffect } from '@/lib/gsap';

/**
 * The statement is pinned and lit one word at a time as the section scrubs
 * past, so the reader sets the pace of the sentence rather than the page.
 *
 * Without scripting the paragraph is simply a paragraph — the reveal starts
 * from full opacity and GSAP dims it, never the other way round.
 */
export default function Manifesto() {
  const root = useRef<HTMLElement>(null);
  const copy = useRef<HTMLParagraphElement>(null);

  useIsoLayoutEffect(() => {
    const el = root.current;
    const target = copy.current;
    if (!el || !target) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const split = new SplitType(target, { types: 'words', tagName: 'span' });

    const ctx = gsap.context(() => {
      gsap.fromTo(
        split.words,
        { opacity: 0.16 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.6,
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: '+=150%',
            scrub: 0.6,
            pin: true,
            anticipatePin: 1,
          },
        }
      );

      gsap.to('.manifesto-seal', {
        rotate: 62,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
      });
    }, el);

    return () => {
      ctx.revert();
      split.revert();
    };
  }, []);

  return (
    <section
      ref={root}
      id="manifesto"
      aria-label="About VAPR"
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-void"
    >
      <div
        aria-hidden
        className="manifesto-seal pointer-events-none absolute left-1/2 top-1/2 w-[min(78vmin,44rem)] -translate-x-1/2 -translate-y-1/2 text-chalk opacity-[0.055]"
      >
        <Emblem variant="mark" />
      </div>

      <div className="gutter relative w-full">
        <p
          ref={copy}
          className="type-wide max-w-[22ch] text-[clamp(1.5rem,3.6vw,2.75rem)] font-light leading-[1.28] text-chalk"
        >
          {MANIFESTO.body}
        </p>
        <p className="type-label mt-10 md:mt-14">{MANIFESTO.attribution}</p>
      </div>
    </section>
  );
}
