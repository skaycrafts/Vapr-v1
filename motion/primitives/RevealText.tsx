'use client';

import { useRef, useState, type ElementType, type ReactNode } from 'react';
import SplitType from 'split-type';
import { gsap } from '@/lib/gsap';
import { useCapability } from '@/motion/capability';
import { useMotionEffect, useFontsReady, refreshScrollTriggers } from '@/motion/useMotionEffect';
import { CONTENT, CINEMA, EASE, STAGGER } from '@/motion/config';

type Mode = 'lines' | 'words' | 'chars';

export type RevealTextProps = {
  children: ReactNode;
  /**
   * How finely to break the type.
   *
   * `chars` is reserved for the hero and major section titles — per-character
   * animation on body copy reads as a gimmick and delays comprehension (§06).
   */
  mode?: Mode;
  as?: ElementType;
  className?: string;
  /** Start when the element reaches this point in the viewport. */
  start?: string;
  /** Seconds of delay after the trigger fires. */
  delay?: number;
  /** Play immediately on mount instead of waiting for scroll (hero use). */
  immediate?: boolean;
  /** Hold until an external sequence says go — the entry timeline uses this. */
  enabled?: boolean;
  /** Cinematic weight for statements; content weight for everything else. */
  scale?: 'content' | 'cinema';
};

/**
 * Type that emerges from the page rather than fading onto it.
 *
 * Each line sits in a clipping box and rises into it, so the words are
 * uncovered by the mask instead of appearing through opacity alone. That is
 * the difference between text that feels physical and text that feels like a
 * CSS transition (§05).
 *
 * The markup renders its children as ordinary text first. If scripting fails,
 * the font never loads, or the visitor asked for reduced motion, the sentence
 * is simply a sentence — the animation only ever removes a covering, it is
 * never what puts the words on screen.
 */
export default function RevealText({
  children,
  mode = 'lines',
  as = 'div',
  className,
  start = 'top 82%',
  delay = 0,
  immediate = false,
  enabled = true,
  scale = 'content',
}: RevealTextProps) {
  const root = useRef<HTMLElement>(null);
  const { animate } = useCapability();
  const [fontsReady, setFontsReady] = useState(false);

  // Splitting before the real face has loaded measures the fallback's line
  // boxes, so the lines re-wrap the moment the webfont swaps in (§32).
  useFontsReady(() => setFontsReady(true));

  useMotionEffect(
    root,
    () => {
      const el = root.current;
      if (!el || !fontsReady || !enabled) return;

      const split = new SplitType(el, {
        types: mode === 'chars' ? 'lines,words,chars' : mode === 'words' ? 'lines,words' : 'lines',
        tagName: 'span',
      });

      const targets =
        mode === 'chars' ? split.chars : mode === 'words' ? split.words : split.lines;

      if (!targets?.length) {
        split.revert();
        return;
      }

      // Each line gets its own clipping box so the reveal is a mask, not a
      // fade. `-0.2em` of vertical slack keeps descenders and diacritics from
      // being sheared off by the clip.
      const masks: HTMLElement[] = [];
      (split.lines ?? []).forEach((line) => {
        line.style.overflow = 'hidden';
        line.style.paddingBottom = '0.2em';
        line.style.marginBottom = '-0.2em';
        masks.push(line);
      });

      const duration = scale === 'cinema' ? CINEMA.fast : CONTENT.slow;
      const stagger =
        mode === 'chars' ? STAGGER.chars : mode === 'words' ? STAGGER.words : STAGGER.lines;

      const tl = gsap.timeline({
        delay,
        defaults: { ease: scale === 'cinema' ? EASE.outLong : EASE.out },
        scrollTrigger: immediate
          ? undefined
          : { trigger: el, start, once: true },
      });

      tl.from(targets, {
        yPercent: 115,
        duration,
        stagger,
      });

      // Opacity is deliberately absent on the mask modes: the clip already
      // hides the glyphs, and fading as well makes the arrival feel soft
      // rather than deliberate. Chars are the exception — a per-character
      // mask on a long word reads as a shutter, so those fade instead.
      if (mode === 'chars') {
        tl.from(targets, { opacity: 0, duration: duration * 0.6, stagger }, 0);
      }

      // Splitting changes the element's height; anything pinned below it is
      // now measured against a stale layout.
      refreshScrollTriggers();

      return () => {
        masks.forEach((line) => {
          line.style.overflow = '';
          line.style.paddingBottom = '';
          line.style.marginBottom = '';
        });
        split.revert();
      };
    },
    [fontsReady, enabled, mode, immediate, delay, start, scale]
  );

  // `as` is genuinely polymorphic, so the element type is not knowable here.
  // Narrowing both it and the ref to a div is a lie that costs nothing: the
  // only thing done with the node is `SplitType`, which takes any element.
  const Tag = as as 'div';
  const ref = root as React.RefObject<HTMLDivElement | null>;

  // `data-motion` is the hook the global reduced-motion rule uses to force
  // everything back to its resting state (see globals.css).
  return (
    <Tag ref={ref} className={className} data-motion={animate ? 'text' : undefined}>
      {children}
    </Tag>
  );
}
