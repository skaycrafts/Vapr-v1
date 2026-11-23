import Link from 'next/link';
import { ArrowUpRight, Plus } from 'lucide-react';
import { LOCATIONS, type Location } from '@/lib/content';

/**
 * The property in sentences, and the questions guests ask before booking.
 *
 * Everything above this on the page is a specification — a name, a rating, a
 * list of inclusions, a ring of distances. That reads well and quotes badly:
 * nothing in it says, in one place, "this is the hotel near the airport".
 * This section does, in a paragraph that stands on its own, and then answers
 * the half-dozen questions the desk is asked on the phone.
 *
 * A server component with no motion. It is the part of the page search
 * engines and answer engines lift, so it is plain text that is there in the
 * first byte of HTML whether or not a single script runs. The answers sit in
 * `<details>`, which keeps them in the document while closed.
 *
 * The questions are the same list the FAQ structured data is built from, so
 * the markup can never describe questions the page does not show.
 */
export default function PropertyGuide({ location }: { location: Location }) {
  const other = LOCATIONS.find((l) => l.slug !== location.slug);

  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="on-ink gutter relative bg-paper pb-20 md:pb-28"
    >
      <div className="grid gap-12 border-t border-hairline pt-16 md:grid-cols-12 md:gap-10 md:pt-20">
        <div className="md:col-span-4">
          <h2
            id="about-title"
            className="type-display text-[clamp(2rem,4.4vw,3.5rem)] text-ink"
          >
            About {location.name}
          </h2>
          <p className="mt-7 max-w-[52ch] text-lg leading-relaxed text-mist">
            {location.seo.intro}
          </p>

          {other ? (
            <p className="mt-8 max-w-[46ch] text-sm leading-relaxed text-smoke">
              Looking for the {other.slug === 'guindy' ? 'airport side' : 'city side'}?{' '}
              <Link
                href={`/${other.slug}`}
                className="text-bone underline underline-offset-4 transition-colors hover:text-ink"
              >
                {other.seo.positioning}
                <ArrowUpRight size={13} strokeWidth={1.5} aria-hidden className="ml-1 inline align-[-1px]" />
              </Link>
            </p>
          ) : null}
        </div>

        <div className="md:col-span-7 md:col-start-6">
          <h2 className="type-label mb-2">Questions guests ask</h2>
          <ul>
            {location.faqs.map(({ q, a }) => (
              <li key={q} className="border-t border-hairline">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 py-4 text-bone transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
                    <h3 className="text-base font-normal text-inherit">{q}</h3>
                    <Plus
                      size={15}
                      strokeWidth={1.5}
                      aria-hidden
                      className="shrink-0 text-smoke transition-transform duration-300 group-open:rotate-45"
                    />
                  </summary>
                  <p className="max-w-[60ch] pb-5 leading-relaxed text-mist">{a}</p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
