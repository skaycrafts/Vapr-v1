'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Closure, Rate } from '@/lib/enquiry-shape';

type Location = { slug: string; name: string };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pretty = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return y && m && d ? `${d} ${MONTHS[m - 1]} ${y}` : iso;
};

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export default function RatesEditor({
  locations,
  rates,
  closures,
}: {
  locations: Location[];
  rates: Rate[];
  closures: Closure[];
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      locations.map((l) => [l.slug, String(rates.find((r) => r.location === l.slug)?.nightly ?? '')])
    )
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const [range, setRange] = useState({ location: locations[0]?.slug ?? '', startsOn: '', endsOn: '', note: '' });
  const [error, setError] = useState<string | null>(null);

  const refresh = () => start(() => router.refresh());

  const saveRate = async (slug: string) => {
    setSaving(slug);
    setError(null);
    const raw = draft[slug]?.trim() ?? '';
    const response = await fetch('/api/admin/rates', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ location: slug, nightly: raw === '' ? null : raw }),
    });
    const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    setSaving(null);
    if (!data.ok) {
      setError(data.error ?? 'That did not save.');
      return;
    }
    setSaid(slug);
    window.setTimeout(() => setSaid((current) => (current === slug ? null : current)), 2200);
    refresh();
  };

  const addRange = async () => {
    setError(null);
    const response = await fetch('/api/admin/rates', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(range),
    });
    const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!data.ok) {
      setError(data.error ?? 'That did not save.');
      return;
    }
    setRange({ location: range.location, startsOn: '', endsOn: '', note: '' });
    refresh();
  };

  const field =
    'w-full border-b border-hairline-strong bg-transparent py-2 text-ink transition-colors focus-visible:border-ink focus-visible:outline-none';

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        {locations.map((location) => (
          <div
            key={location.slug}
            className="flex flex-wrap items-end gap-4 rounded-2xl bg-pitch p-5 ring-1 ring-hairline"
          >
            <div className="min-w-[8rem] flex-1">
              <p className="type-label mb-1">{location.name}</p>
              <label className="flex items-baseline gap-2">
                <span className="text-mist">₹</span>
                <input
                  inputMode="numeric"
                  value={draft[location.slug] ?? ''}
                  placeholder="On enquiry"
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      // Digits only: the server rejects anything else anyway,
                      // and rejecting it here means never having to say so.
                      [location.slug]: event.target.value.replace(/[^\d]/g, ''),
                    }))
                  }
                  className={`${field} tabular text-lg`}
                  aria-label={`Nightly rate at ${location.name}, in rupees`}
                />
                <span className="whitespace-nowrap text-sm text-smoke">/ night</span>
              </label>
            </div>
            <button
              type="button"
              onClick={() => saveRate(location.slug)}
              disabled={saving === location.slug}
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-opacity disabled:opacity-40"
            >
              {saving === location.slug ? 'Saving…' : said === location.slug ? 'Saved' : 'Save'}
            </button>
          </div>
        ))}
        <p className="text-sm text-smoke">
          Empty means the website shows <i>On enquiry</i>. The figure appears as a
          &ldquo;from&rdquo; price, so it should be the lowest a room goes for.
        </p>
      </section>

      <section>
        <h2 className="type-display mb-1 text-2xl text-ink">Dates not available</h2>
        <p className="mb-4 max-w-[60ch] text-sm text-mist">
          A guest asking to arrive inside one of these ranges is told so by the form instead of
          waiting for a call back. It does not touch rooms already booked — this site has no
          booking engine, only enquiries.
        </p>

        <div className="rounded-2xl bg-pitch p-5 ring-1 ring-hairline">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="type-label mb-1 block">Property</span>
              <select
                value={range.location}
                onChange={(event) => setRange({ ...range, location: event.target.value })}
                className={field}
              >
                {locations.map((location) => (
                  <option key={location.slug} value={location.slug}>
                    {location.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="type-label mb-1 block">From</span>
              <input
                type="date"
                min={today()}
                value={range.startsOn}
                onChange={(event) => setRange({ ...range, startsOn: event.target.value })}
                className={`${field} tabular`}
              />
            </label>
            <label className="block">
              <span className="type-label mb-1 block">To</span>
              <input
                type="date"
                min={range.startsOn || today()}
                value={range.endsOn}
                onChange={(event) => setRange({ ...range, endsOn: event.target.value })}
                className={`${field} tabular`}
              />
            </label>
            <label className="block">
              <span className="type-label mb-1 block">Why (optional)</span>
              <input
                value={range.note}
                placeholder="Full, repairs…"
                onChange={(event) => setRange({ ...range, note: event.target.value })}
                className={field}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={addRange}
            disabled={!range.startsOn || !range.endsOn}
            className="mt-5 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-opacity disabled:opacity-40"
          >
            Close these dates
          </button>
        </div>

        {error ? (
          <p role="alert" className="mt-3 text-sm text-ink">
            {error}
          </p>
        ) : null}

        <ul className="mt-4 space-y-2">
          {closures.length === 0 ? (
            <li className="text-sm text-smoke">Both hotels are open on every date.</li>
          ) : (
            closures.map((closure) => (
              <li
                key={closure.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-pitch px-4 py-3 ring-1 ring-hairline"
              >
                <span className="text-sm text-ink">
                  <b>{locations.find((l) => l.slug === closure.location)?.name ?? closure.location}</b>
                  {' · '}
                  <span className="tabular">
                    {pretty(closure.startsOn)}
                    {closure.endsOn !== closure.startsOn ? ` – ${pretty(closure.endsOn)}` : ''}
                  </span>
                  {closure.note ? <span className="text-mist"> · {closure.note}</span> : null}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await fetch(`/api/admin/closures/${closure.id}`, { method: 'DELETE' });
                    refresh();
                  }}
                  className="text-sm text-mist transition-colors hover:text-ink"
                >
                  Open again
                </button>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
