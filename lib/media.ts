import { IMAGES, VIDEOS, IMAGE_WIDTHS, type Rendition } from './media.generated';

export { IMAGES, VIDEOS, IMAGE_WIDTHS };
export type { Rendition };
export type ImageSlug = keyof typeof IMAGES;
export type VideoSlug = keyof typeof VIDEOS;

const BASE = '/media/img';

/**
 * The pipeline skips renditions wider than the source, so build the srcset
 * from the widths that can actually exist for this image.
 */
function widthsFor(slug: ImageSlug) {
  const { width } = IMAGES[slug];
  const usable = IMAGE_WIDTHS.filter((w) => w <= width * 1.05);
  return usable.length ? usable : [IMAGE_WIDTHS[0]];
}

export function srcSet(slug: ImageSlug, format: 'avif' | 'webp') {
  return widthsFor(slug)
    .map((w) => `${BASE}/${slug}-${w}.${format} ${w}w`)
    .join(', ');
}

/** Largest available rendition — the `src` fallback for the `<img>`. */
export function fallbackSrc(slug: ImageSlug) {
  const widths = widthsFor(slug);
  return `${BASE}/${slug}-${widths[widths.length - 1]}.webp`;
}

/**
 * A rendition that exists, with its real dimensions — for share cards and the
 * image sitemap, which name one file rather than a srcset.
 *
 * Capped at 1600 by default: large enough for every share card, small enough
 * to be fetched quickly by the crawlers that render them. Below the cap it is
 * the largest width the pipeline produced, so an image whose source is
 * narrower than 1600 is never pointed at a file that was never written.
 */
export function renditionOf(slug: ImageSlug, max = 1600) {
  const { width, height } = IMAGES[slug];
  const widths = widthsFor(slug).filter((w) => w <= max);
  const w = widths.length ? widths[widths.length - 1] : widthsFor(slug)[0];
  return {
    url: `${BASE}/${slug}-${w}.webp`,
    width: w,
    height: Math.round((w * height) / width),
  };
}

export function image(slug: ImageSlug) {
  return IMAGES[slug];
}

export function video(slug: VideoSlug) {
  return {
    ...VIDEOS[slug],
    mp4: `/media/video/${slug}.mp4`,
    webm: `/media/video/${slug}.webm`,
    poster: `/media/video/${slug}-poster.jpg`,
  };
}
