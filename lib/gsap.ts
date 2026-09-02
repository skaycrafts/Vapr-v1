'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLayoutEffect, useEffect } from 'react';

// This module is evaluated once, so a single registration is enough.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
  // Pinned sections read layout constantly. Batching the reads keeps the
  // main thread out of layout thrash during fast scrubs.
  ScrollTrigger.config({ ignoreMobileResize: true });

  // Development only: a handle on the animation engine from the console, for
  // inspecting timeline progress and ScrollTrigger measurements while tuning.
  // Stripped from production builds by the bundler's dead-code elimination.
  if (process.env.NODE_ENV === 'development') {
    Object.assign(window, { gsap, ScrollTrigger });
  }
}

/** `useLayoutEffect` that does not warn during SSR. */
export const useIsoLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export { gsap, ScrollTrigger };
