import type { MetadataRoute } from 'next';
import { LOCATIONS, SITE } from '@/lib/content';

/**
 * Every public page, from the same list the routes are generated from — a
 * third property added to `LOCATIONS` is in the sitemap without anyone
 * remembering to put it there. The policy pages join this list when they
 * exist; listing them now would hand crawlers three 404s.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE.url, changeFrequency: 'monthly', priority: 1 },
    ...LOCATIONS.map((l) => ({
      url: `${SITE.url}/${l.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    })),
  ];
}
