import { NextResponse, type NextRequest } from 'next/server';
import { LOCATIONS } from '@/lib/content';

/**
 * One job: send near-miss property URLs to the property.
 *
 * `/guindy` and `/ashok-nagar` are the only two addresses that exist, and URL
 * paths are case-sensitive — so `/Guindy`, typed or pasted from somewhere
 * that title-cased it, was a 404 on a site that plainly has a Guindy page.
 * The same for `/ashoknagar` without the hyphen, and for `/ekkatuthangal`,
 * which is the name the second hotel was called here until recently and is
 * still its postal locality, so it is exactly what someone would try.
 *
 * Everything else falls through untouched and gets the 404 page, which now
 * offers both hotels rather than a line of system type.
 *
 * Named `proxy` rather than `middleware`: the middleware convention is
 * deprecated in Next 16 and renamed, though it does the same thing.
 */

/**
 * Every slug, keyed by its letters alone. `ashoknagar`, `ashok-nagar` and
 * `ashok_nagar` all reduce to the same key, so a missing hyphen misses
 * nothing.
 */
const bare = (value: string) => value.replace(/[^a-z0-9]/g, '');
const SLUGS = new Map(LOCATIONS.map((l) => [bare(l.slug), l.slug]));

/** Other names for the same two buildings, also keyed bare. */
const ALIASES: Record<string, string> = {
  ekkatuthangal: 'guindy',
  vaprguindy: 'guindy',
  guindychennai: 'guindy',
  vaprashoknagar: 'ashok-nagar',
  ashoknagarchennai: 'ashok-nagar',
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // `/Ashok%20Nagar` → `ashok-nagar`: decoded, lowercased, trailing slash off,
  // and spaces or underscores folded to the hyphen the slugs use.
  let key: string;
  try {
    key = decodeURIComponent(pathname);
  } catch {
    return NextResponse.next(); // Malformed escape; not ours to fix.
  }
  key = key.replace(/^\/+|\/+$/g, '').toLowerCase().replace(/[\s_]+/g, '-');

  const target = SLUGS.get(bare(key)) ?? ALIASES[key] ?? ALIASES[bare(key)];
  if (!target || pathname === `/${target}`) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${target}`;
  // 308: permanent, and the method is preserved.
  return NextResponse.redirect(url, 308);
}

export const config = {
  // Single-segment paths only. Nothing nested, and no static asset, can match
  // a property slug, so there is no reason to run on them.
  matcher: ['/:slug'],
};
