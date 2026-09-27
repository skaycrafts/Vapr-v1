import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { LOCATIONS, SITE } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Page not found',
  // A 404 that gets indexed is a 404 that shows up in results.
  robots: { index: false, follow: true },
};

/**
 * The page anyone lands on after a mistyped address, an old link, or one of
 * the policy links that has no page behind it yet.
 *
 * It replaces Next's default, which is an unstyled line of system type on a
 * white field — on a site that is otherwise black, that reads as the site
 * being broken rather than as one address being wrong. This one is in the
 * site's own voice and, more usefully, ends where the two hotels are: a
 * visitor who was trying to reach one of them should not have to go back to
 * the homepage to find it.
 */
export default function NotFound() {
  return (
    <section className="on-ink flex min-h-[78svh] items-center bg-paper py-24 md:py-32">
      <div className="gutter w-full">
        <p className="type-label">404</p>
        <h1 className="type-display mt-4 max-w-[18ch] text-[clamp(2.25rem,5vw,4rem)] text-ink">
          That page isn&rsquo;t here
        </h1>
        <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-mist">
          The address may have changed, or it may never have existed. {SITE.name} is
          two small hotels — both of them are one click away.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          {LOCATIONS.map((loc) => (
            <Link
              key={loc.slug}
              href={`/${loc.slug}`}
              data-cursor="Explore"
              className="group on-paper inline-flex items-center gap-2.5 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper ring-1 ring-white/25 transition-colors duration-500 hover:bg-bone"
            >
              {loc.area}
              <ArrowUpRight
                size={15}
                strokeWidth={1.5}
                aria-hidden
                className="transition-transform duration-500 ease-[var(--ease-out-quart)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>
          ))}
          <Link
            href="/"
            className="inline-flex items-center rounded-full px-6 py-3 text-sm text-mist ring-1 ring-hairline-strong transition-colors duration-500 hover:text-ink"
          >
            Back to the homepage
          </Link>
        </div>
      </div>
    </section>
  );
}
