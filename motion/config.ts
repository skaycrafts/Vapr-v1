/**
 * The motion vocabulary. Every animation on the site draws its timing from
 * here, so the choreography stays consistent across sections written months
 * apart — and so "how long should this be?" has one answer rather than thirty.
 *
 * The three tiers exist to stop the most common failure in cinematic work:
 * cinematic timing applied to a button, or UI timing applied to a chapter.
 * A micro interaction that takes 1.2s feels broken; a chapter transition that
 * takes 0.2s feels cheap.
 */

/** LEVEL 1 — micro. Buttons, links, cursor, icons. */
export const MICRO = {
  fast: 0.2,
  base: 0.32,
  slow: 0.5,
} as const;

/** LEVEL 2 — content. Text, images, cards, gallery. */
export const CONTENT = {
  fast: 0.5,
  base: 0.75,
  slow: 1,
} as const;

/** LEVEL 3 — cinematic. Pinned scenes, chapter and property transitions. */
export const CINEMA = {
  fast: 1,
  base: 1.4,
  slow: 1.8,
  epic: 2.4,
} as const;

/**
 * Easing. Everything decelerates: the page arrives and settles, it never
 * overshoots. `inOut` is reserved for large movements that need to start from
 * rest as well as end there — a pinned scene, a curtain, the field lifting.
 *
 * Deliberately absent: back, elastic and bounce. A hotel does not bounce.
 */
export const EASE = {
  /** Default for content arriving. Confident, unhurried. */
  out: 'power3.out',
  /** Small UI. Enough deceleration to feel damped, not enough to feel slow. */
  outSoft: 'power2.out',
  /** The long tail — for type and image reveals that should feel weightless. */
  outLong: 'expo.out',
  /** Large cinematic movement that starts and stops. */
  inOut: 'power3.inOut',
  /** The heaviest move on the site. Curtains, field lifts, chapter changes. */
  inOutHeavy: 'expo.inOut',
  /** Scrubbed timelines only: the scroll position is the easing. */
  none: 'none',
} as const;

/**
 * Stagger. Small enough that a reader never waits for the animation to finish
 * before they can read the sentence — §27 is an accessibility rule, not a
 * taste one.
 */
export const STAGGER = {
  chars: 0.012,
  words: 0.04,
  lines: 0.08,
  items: 0.06,
  panels: 0.1,
} as const;

/**
 * Scrub values. `true` locks the timeline to the scroll position exactly;
 * a number adds that many seconds of catch-up, which reads as weight.
 * Anything above ~1.2 starts to feel like the page is ignoring you.
 */
export const SCRUB = {
  /** Locked. For parallax, where lag reads as lag. */
  tight: true,
  /** The default for scrubbed scenes — enough inertia to feel heavy. */
  weighted: 0.7,
  /** Slow drift for background layers. */
  loose: 1.1,
} as const;

/**
 * Parallax travel, in percent of the element's own height, and mouse parallax
 * ceilings in pixels (§12). Kept small on purpose: if the visitor notices the
 * image is moving, it is too much.
 */
export const DRIFT = {
  image: 12,
  background: 6,
  foreground: 3,
} as const;

export const MOUSE = {
  background: 5,
  image: 10,
  foreground: 3,
} as const;
