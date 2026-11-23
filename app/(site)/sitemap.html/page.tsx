import type { Metadata } from 'next';
import Link from 'next/link';
import { DETAIL, LOCATIONS, LOCATIONS_INTRO, RESERVE, SITE, placeOf } from '@/lib/content';

/**
 * The sitemap a person reads, as opposed to the one a crawler parses.
 *
 * `/sitemap.xml` is for machines and lists three URLs. This is the other
 * kind: every page, and what is on each page, as one index — the thing
 * hotel sites have had at `/sitemap.html` for twenty years, and which both
 * search engines and the AI assistants people now ask for recommendations
 * use to understand how a site hangs together.
 *
 * ── Why the sections are listed, not just the pages ───────────────────
 * The reference for this was Hablis's, which nests about a hundred and
 * seventy links under headings like ROOMS and DINING. This site has three
 * pages. Listing three links and calling it an index would be a page that
 * exists to say it exists; listing what is *on* each page — the rooms, the
 * shared spaces, the way there, the enquiry — is the same service their
 * tree performs, at the size this site actually is.
 *
 * Anchors come from the sections themselves, so a link here cannot drift
 * from the page it points at without the page losing its own id first.
 */

export const metadata: Metadata = {
  title: 'Sitemap',
  description: `Every page on the ${SITE.name} website: both hotels in ${SITE.city} — ${LOCATIONS.map((l) => l.area).join(' and ')} — and what each page covers.`,
  alternates: { canonical: '/sitemap.html' },
};

type Entry = { label: string; href: string; note?: string };

export default function SitemapPage() {
  const home: Entry[] = [
    { label: LOCATIONS_INTRO.title, href: '/#locations', note: 'Both hotels, and a door to each' },
    { label: 'Chennai', href: '/#chennai', note: 'What a stay here is for' },
    { label: DETAIL.title, href: '/#detail', note: 'What is included at both' },
    { label: RESERVE.title, href: '/#reserve', note: 'Send an enquiry to the desk' },
  ];

  const sectionsFor = (slug: string): Entry[] => [
    { label: 'The rooms', href: `/${slug}#room`, note: 'Occupancy, what is in the room, check-in times' },
    { label: 'The rest of it', href: `/${slug}#spaces`, note: 'The shared rooms of the building' },
    { label: DETAIL.title, href: `/${slug}#detail`, note: 'What is included, and what each hotel adds' },
    { label: 'Getting there', href: `/${slug}#getting-there`, note: 'The address, the map, what is nearby' },
    { label: RESERVE.title, href: `/${slug}#reserve`, note: 'Send an enquiry for this hotel' },
  ];

  const groups = [
    { title: SITE.name, href: '/', note: `${SITE.tagline}`, children: home },
    ...LOCATIONS.map((location) => ({
      title: location.name,
      href: `/${location.slug}`,
      note: placeOf(location),
      children: sectionsFor(location.slug),
    })),
  ];

  return (
    <section className="gutter bg-paper py-24 md:py-32">
      <header className="max-w-[60ch]">
        <p className="type-label">{SITE.name}</p>
        <h1 className="type-display mt-4 text-[clamp(2.5rem,6vw,4.5rem)] text-ink">Sitemap</h1>
        <p className="mt-5 text-lg leading-relaxed text-mist">
          Everything on this website, in one place. {SITE.name} is{' '}
          {LOCATIONS.length === 2 ? 'two hotels' : `${LOCATIONS.length} hotels`} in {SITE.city} —{' '}
          {LOCATIONS.map((l) => l.area).join(' and ')} — and each has a page of its own.
        </p>
      </header>

      <div className="mt-14 grid gap-12 md:mt-20 md:grid-cols-3 md:gap-10">
        {groups.map((group) => (
          <nav key={group.href} aria-labelledby={`map-${group.href}`}>
            <h2 id={`map-${group.href}`} className="border-b border-hairline pb-4">
              <Link
                href={group.href}
                className="type-display text-[clamp(1.5rem,2.6vw,2rem)] text-ink underline-offset-[6px] transition-colors hover:underline"
              >
                {group.title}
              </Link>
              <span className="type-label mt-2 block text-smoke">{group.note}</span>
            </h2>

            <ul className="mt-5 space-y-4">
              {group.children.map((child) => (
                <li key={child.href}>
                  <Link
                    href={child.href}
                    className="text-bone underline-offset-4 transition-colors hover:text-ink hover:underline"
                  >
                    {child.label}
                  </Link>
                  {child.note ? (
                    <span className="mt-0.5 block text-sm text-smoke">{child.note}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/*
        The policy pages are deliberately absent until they exist. The footer
        links them because they are where they will be; an index that sends a
        reader — or a crawler — to three 404s is worse than one that waits.
      */}
      <p className="mt-16 max-w-[60ch] text-sm text-smoke md:mt-20">
        Crawlers want{' '}
        <a href="/sitemap.xml" className="underline underline-offset-4 hover:text-ink">
          /sitemap.xml
        </a>
        . Both hotels take enquiries through the form on their own page, and the desk answers
        within thirty minutes.
      </p>
    </section>
  );
}
