'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '@/lib/gsap';

/**
 * Drives the page with Lenis and hands ScrollTrigger the same clock, so
 * scrubbed timelines stay locked to the smoothed scroll position instead of
 * racing it by a frame.
 *
 * Respects `prefers-reduced-motion`: the smoothing is skipped entirely and
 * the browser's native scroll takes over.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The shell persists across routes, so nothing resets the scroll or
  // remeasures the pinned sections on its own. Both are done here.
  useEffect(() => {
    const lenis = window.__lenis;
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);

    // Let the incoming route paint before ScrollTrigger takes measurements.
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches) {
      ScrollTrigger.refresh();
      return;
    }

    const lenis = new Lenis({
      duration: 1.15,
      // Long, flat tail — the page keeps gliding after the wheel stops, which
      // is most of what makes scrolling feel expensive.
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      lerp: 0.1,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      syncTouch: false,
      autoRaf: false,
    });

    // Expose it for the nav's anchor scrolling.
    window.__lenis = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Late-loading imagery changes section heights; recompute once settled.
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);

    return () => {
      window.removeEventListener('load', onLoad);
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  return <>{children}</>;
}

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}
