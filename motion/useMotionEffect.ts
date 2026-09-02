'use client';

import { useEffect, type RefObject } from 'react';
import { gsap, ScrollTrigger, useIsoLayoutEffect } from '@/lib/gsap';
import { useCapability } from '@/motion/capability';

type MotionScope = {
  /** Scoped selector — only matches inside the ref. Use instead of raw strings. */
  q: (selector: string) => HTMLElement[];
  /** The GSAP context, for anything needing the raw API. */
  ctx: gsap.Context;
};

type Setup = (scope: MotionScope) => void | (() => void);

/**
 * Runs a GSAP setup function inside a scope-bound `gsap.context`, and only
 * when the device has agreed to motion.
 *
 * This is the hook every animated section uses. It exists because the same
 * eight lines — check reduced motion, open a context, build, revert on
 * cleanup — were repeated in every section, and a section that got them
 * slightly wrong leaked ScrollTriggers across route changes.
 *
 * Three guarantees:
 *  - it never runs when the visitor asked for reduced motion (§30);
 *  - everything created inside is reverted on unmount, including
 *    ScrollTriggers, pin spacers and inline styles;
 *  - selectors are scoped to the ref, so two instances of the same component
 *    cannot animate each other's nodes.
 */
export function useMotionEffect(
  scope: RefObject<HTMLElement | null>,
  setup: Setup,
  deps: unknown[] = []
) {
  const { animate } = useCapability();

  useIsoLayoutEffect(() => {
    const el = scope.current;
    if (!el || !animate) return;

    let cleanup: void | (() => void);

    const ctx = gsap.context((self) => {
      cleanup = setup({
        q: (selector: string) => (self.selector?.(selector) ?? []) as HTMLElement[],
        ctx: self,
      });
    }, el);

    return () => {
      cleanup?.();
      // Reverts tweens, ScrollTriggers, pin spacing and any inline styles
      // GSAP applied — the whole reason for using a context.
      ctx.revert();
    };
    // `scope` is a ref: stable by definition, and intentionally not a dep.
  }, [animate, ...deps]);
}

/**
 * Remeasures every ScrollTrigger once, on the next frame.
 *
 * Needed whenever something outside GSAP's knowledge changes the page height:
 * the entry sequence releasing the scroll lock, a property panel swapping to a
 * taller image, an accordion opening. Batched to a frame so ten callers in one
 * tick cost one measurement pass.
 */
let refreshQueued = false;
export function refreshScrollTriggers() {
  if (refreshQueued) return;
  refreshQueued = true;
  requestAnimationFrame(() => {
    refreshQueued = false;
    ScrollTrigger.refresh();
  });
}

/**
 * Fires once the web fonts are in. Type animations that measure line boxes
 * must wait for this or they split against the fallback face and reflow
 * mid-animation (§32).
 */
export function useFontsReady(onReady: () => void) {
  useEffect(() => {
    let cancelled = false;
    const fonts = document.fonts;

    if (!fonts) {
      onReady();
      return;
    }

    fonts.ready
      .then(() => {
        if (!cancelled) onReady();
      })
      .catch(() => {
        // A font that never resolves must not mean type that never appears.
        if (!cancelled) onReady();
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
