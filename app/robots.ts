import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/content';

/**
 * Everything public is open — to search engines and to the AI assistants
 * people now ask "where should I stay near the airport?", which is a
 * question this site wants to be the answer to. The desk and the API are
 * closed: they are noindex already, and there is no reason to spend a
 * crawler's visit on them.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
