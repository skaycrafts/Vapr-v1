'use client';

import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useCapability } from '@/motion/capability';

/**
 * The single scroll authority for the whole site.
 *
 *   Lenis  →  gsap.ticker  →  ScrollTrigger.update()  →  section timelines
 *
 * One Lenis instance, one ticker, one update path. Nothing else on the site is
 * permitted to construct a Lenis or add a raf loop; sections that need the
 * scroll position ask for it here.
 *
 * Consumers reach it through `useScroll()` rather than reading `window`, so a
 * component mounting before the provider's effect gets working helpers instead
 * of silently falling back to native scrolling. `window.__lenis` is still set,
 * because non-React call sites (and the browser console) genuinely want it.
 */

type ScrollApi = {
  /**
   * The live instance, or null when smoothing is off. A getter rather than a
   * value: the instance is created in an effect, and storing it in state to
   * publish it would mean a second render pass on every mount for something no
   * consumer renders from.
   */
  getLenis: () => Lenis | null;
  /** Glide to an element or offset. Falls back to native when Lenis is off. */
  scrollTo: (
    target: string | number | HTMLElement,
    options?: { offset?: number; duration?: number }
  ) => void;
  /** Used by the entry sequence and the mobile menu to hold the page still. */
  stop: () => void;
  start: () => void;
};

const ScrollContext = createContext<ScrollApi | null>(null);

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const { ready, reducedMotion } = useCapability();
  const pathname = usePathname();
  // Kept in a ref as well so the imperative helpers below never close over a
  // stale instance between renders.
  const instance = useRef<Lenis | null>(null);

  useEffect(() => {
    // Wait for the capability measurement. Building Lenis and then destroying
    // it one frame later when reduced-motion resolves causes a visible jump.
    if (!ready) return;

    // Reduced motion: native scrolling, and ScrollTrigger drives itself off
    // the real scroll position. Everything still works, nothing is smoothed.
    if (reducedMotion) {
      ScrollTrigger.refresh();
      return;
    }

    const next = new Lenis({
      // Weighted, not floaty. Past ~1.3s the page stops feeling like it is
      // responding to you and starts feeling like it is buffering (§02).
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      lerp: 0.1,
      wheelMultiplier: 1,
      // Native touch scrolling. Smoothing a thumb drag is the single fastest
      // way to make a phone feel broken (§02, §29).
      syncTouch: false,
      touchMultiplier: 1.6,
      autoRaf: false,
    });

    instance.current = next;
    window.__lenis = next;

    // The one line that keeps scrubbed timelines locked to the smoothed
    // position instead of trailing it by a frame.
    next.on('scroll', ScrollTrigger.update);

    const raf = (time: number) => next.raf(time * 1000);
    gsap.ticker.add(raf);
    // GSAP's lag smoothing fights Lenis: after a long frame it jumps the
    // clock forward, which desyncs the scroll position from the timeline.
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      next.destroy();
      instance.current = null;
      if (window.__lenis === next) delete window.__lenis;
    };
  }, [ready, reducedMotion]);

  /**
   * Late-arriving imagery and fonts both change section heights, which
   * invalidates every pinned measurement on the page. Refresh once things
   * have settled rather than guessing with a timeout.
   */
  useEffect(() => {
    if (!ready) return;

    const refresh = () => ScrollTrigger.refresh();

    // Fonts change line-wrapping, which changes heights (§32).
    document.fonts?.ready.then(refresh).catch(() => {});
    window.addEventListener('load', refresh);
    return () => window.removeEventListener('load', refresh);
  }, [ready]);

  /**
   * The shell persists across routes, so nothing resets the scroll position
   * or remeasures pins on navigation. Both happen here.
   */
  useEffect(() => {
    const current = instance.current;
    if (current) current.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);

    // Let the incoming route paint before taking measurements.
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  // Stable across renders: every method reads the ref, so consumers never
  // re-render merely because the instance was created or torn down.
  const api = useMemo<ScrollApi>(
    () => ({
      getLenis: () => instance.current,
      scrollTo: (target, options) => {
        const current = instance.current;
        if (current) {
          // A stopped instance silently ignores scrollTo — the mobile menu and
          // the entry sequence both stop it, so make sure it is running first.
          current.start();
          current.scrollTo(target, { duration: 1.4, ...options });
          return;
        }
        const el =
          typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
        if (typeof el === 'object' && el) el.scrollIntoView({ behavior: 'smooth' });
        else if (typeof target === 'number')
          window.scrollTo({ top: target, behavior: 'smooth' });
      },
      stop: () => instance.current?.stop(),
      start: () => instance.current?.start(),
    }),
    []
  );

  return <ScrollContext.Provider value={api}>{children}</ScrollContext.Provider>;
}

export function useScroll(): ScrollApi {
  const ctx = useContext(ScrollContext);
  if (!ctx) throw new Error('useScroll must be used inside <ScrollProvider>.');
  return ctx;
}

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}
