import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Clamp `n` into [min, max]. */
export const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));

/** Map `n` from one range to another, without clamping. */
export const mapRange = (n: number, a1: number, a2: number, b1: number, b2: number) =>
  b1 + ((n - a1) * (b2 - b1)) / (a2 - a1);

/**
 * Frame-rate independent damping. `t` is the fraction of the remaining
 * distance to cover in 1/60s; `dt` is the real elapsed time in seconds.
 */
export const damp = (current: number, target: number, t: number, dt: number) =>
  current + (target - current) * (1 - Math.pow(1 - t, dt * 60));

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
