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
