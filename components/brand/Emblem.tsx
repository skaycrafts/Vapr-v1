import { cn } from '@/lib/utils';

/**
 * The VAPR emblem — the supplied artwork itself, not a drawing of it.
 *
 * ── What changed, and why ───────────────────────────────────────────────
 * This was an SVG reconstruction: a hand-traced approximation of the seal,
 * kept in vector so the entry sequence could draw it stroke by stroke. It was
 * a careful trace and it was still the wrong thing. The mark is finished
 * artwork with its own ornament, its own Didone, its own line weights and its
 * own spacing, and every one of those was being approximated. A logo that is
 * nearly right is a different logo.
 *
 * So the site renders the file now. `scripts/build-brand.mjs` trims the page
 * away, squares the crop about the circle's own centre, lifts the alpha from
 * the artwork's own luminance and re-inks it white for a black ground — and
 * does nothing else. No detail is added, removed, straightened or restyled.
 *
 * ── Circular, always ────────────────────────────────────────────────────
 * The crop is exactly square (2157×2157, measured off the ink), so
 * `aspect-square` with `object-contain` makes an ellipse impossible however
 * the emblem is sized and whatever flex or grid row it lands in. Width is the
 * only thing a caller sets.
 *
 * ── On the entry sequence ───────────────────────────────────────────────
 * The overture used to draw the seal with `stroke-dashoffset`, which needs
 * path geometry a raster does not have. It resolves rather than draws now.
 * That loses one nice trick, and it is the right trade: the mark that arrives
 * is the mark.
 */

/**
 * Two inks, one artwork.
 *
 * `build-brand.mjs` cuts both from the same alpha channel, so these are the
 * same drawing with the ink swapped rather than two files that might drift.
 * The site is on paper now, so black is the default; the white one is still
 * needed for the sections that kept the black ground — the footer, and the
 * pinned scene.
 */
const INK = {
  ink: { src: '/brand/vapr-emblem.png', stem: '/brand/vapr-emblem' },
  paper: { src: '/brand/vapr-emblem-light.png', stem: '/brand/vapr-emblem-light' },
} as const;

/**
 * Every rendition, so the browser can nearly always draw a file at its real
 * display size rather than shrinking a much larger one. That matters more for
 * this mark than for a photograph: at 56px its hairlines are finer than a
 * device pixel, and a browser's own downscale averages them into grey haze —
 * where each of these was resampled from the 2157px master with Lanczos.
 */
const renditions = (stem: string, src: string) =>
  [48, 64, 96, 112, 144, 192, 256, 512]
    .map((w) => `${stem}-${w}.png ${w}w`)
    .concat(`${src} 1024w`)
    .join(', ');

export type EmblemProps = {
  className?: string;
  /**
   * Give the emblem an accessible name where it is doing a logo's job — the
   * navigation, say. Left off, it is decorative and hidden from assistive
   * technology, which is right everywhere it sits beside a heading that
   * already says VAPR.
   */
  title?: string;
  /** Above the fold: the navigation and the entry sequence. */
  priority?: boolean;
  /** Adds the class the entry sequence animates against. */
  animated?: boolean;
  /** Rendered width, so the browser can pick a rendition. */
  sizes?: string;
  /**
   * Which ink. `'ink'` is the black artwork for the paper ground and is what
   * almost everything wants; `'paper'` is the white one, for the sections
   * that kept the black.
   */
  tone?: keyof typeof INK;
};

export default function Emblem({
  className,
  title,
  priority = false,
  animated = false,
  sizes = '160px',
  tone = 'ink',
}: EmblemProps) {
  const { src, stem } = INK[tone];

  return (
    // A plain <img>: this is a fixed, hand-prepared asset with its own
    // renditions, not something next/image needs to derive at request time.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      srcSet={renditions(stem, src)}
      sizes={sizes}
      width={1024}
      height={1024}
      alt={title ?? ''}
      aria-hidden={title ? undefined : true}
      decoding={priority ? 'sync' : 'async'}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      draggable={false}
      className={cn(
        'block aspect-square h-auto w-full select-none object-contain',
        animated && 'emblem-mark',
        className
      )}
    />
  );
}
