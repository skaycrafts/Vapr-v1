import Link from 'next/link';
import { counts, listEnquiries } from '@/lib/server/enquiries';
import { health } from '@/lib/server/db';
import { getRates } from '@/lib/server/rates';
import { LOCATIONS } from '@/lib/content';
import EnquiryRows from '@/components/admin/EnquiryRows';

export const dynamic = 'force-dynamic';

/** What the desk wants in the first two seconds: how many are waiting. */
export default async function Dashboard() {
  const [tally, recent, state, rates] = await Promise.all([
    counts(),
    listEnquiries({ limit: 8 }),
    health(),
    getRates(),
  ]);

  const tiles = [
    { label: 'New', value: tally.new, accent: true },
    { label: 'Contacted', value: tally.contacted },
    { label: 'Booked', value: tally.booked },
    { label: 'All time', value: tally.total },
  ];

  return (
    <div className="space-y-12">
      <header>
        <h1 className="type-display text-[clamp(2rem,4vw,3rem)] text-ink">Today</h1>
        <p className="mt-2 text-mist">
          {tally.new === 0
            ? 'No new enquiries waiting.'
            : `${tally.new} enquir${tally.new === 1 ? 'y' : 'ies'} waiting for a reply.`}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className={`rounded-2xl p-5 ring-1 ${tile.accent && tile.value > 0 ? 'bg-ink text-paper ring-ink' : 'bg-pitch ring-hairline'}`}
          >
            <p className={`type-label ${tile.accent && tile.value > 0 ? 'text-paper/70' : ''}`}>
              {tile.label}
            </p>
            <p className="tabular mt-2 text-3xl">{tile.value}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="type-display text-2xl text-ink">Latest</h2>
          <Link href="/admin/enquiries" className="text-sm text-mist hover:text-ink">
            All enquiries →
          </Link>
        </div>
        <EnquiryRows enquiries={recent} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-pitch p-5 ring-1 ring-hairline">
          <p className="type-label mb-3">Rates on the website</p>
          <ul className="space-y-1.5 text-sm">
            {LOCATIONS.map((location) => {
              const rate = rates.find((r) => r.location === location.slug);
              return (
                <li key={location.slug} className="flex justify-between gap-4">
                  <span className="text-mist">{location.shortName}</span>
                  <span className="tabular text-ink">
                    {rate?.nightly ? `₹${rate.nightly.toLocaleString('en-IN')}` : 'On enquiry'}
                  </span>
                </li>
              );
            })}
          </ul>
          <Link href="/admin/rates" className="mt-4 inline-block text-sm text-mist hover:text-ink">
            Change →
          </Link>
        </div>

        <div className="rounded-2xl bg-pitch p-5 ring-1 ring-hairline">
          <p className="type-label mb-3">Where this is stored</p>
          <p className="text-sm text-mist">
            <b className="text-ink">{state.store === 'postgres' ? 'Postgres' : 'Local file'}.</b>{' '}
            {state.detail}
          </p>
        </div>
      </section>
    </div>
  );
}
