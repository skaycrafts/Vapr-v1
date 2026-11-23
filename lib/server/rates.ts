import 'server-only';
import { randomUUID } from 'node:crypto';
import { ensureSchema, readFileStore, sql, store, writeFileStore } from './db';
import type { Closure, Rate } from '@/lib/enquiry-shape';

/**
 * What a night costs, and which nights are not available.
 *
 * The site has always said "On enquiry" where a price would go, because the
 * only rate it had was an environment variable nobody had set — and a
 * nightly rate invented by a website is a price someone arrives expecting.
 * This is the desk's own figure, changed from the panel, with the same rule
 * still holding underneath: no rate set, no price shown.
 *
 * A closure is a date range a property is not taking bookings for. It is
 * deliberately not an availability *calendar*: this site has no booking
 * engine, no room inventory and no holds, and a grid of green and red
 * squares would imply all three. It answers one question — can a guest
 * arrive on this date at all — and the enquiry form uses it to stop someone
 * asking for a night the hotel already knows it cannot give them.
 */

export type { Closure, Rate } from '@/lib/enquiry-shape';

const day = (value: unknown): string => {
  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }
  return String(value ?? '').slice(0, 10);
};

/* ── Rates ────────────────────────────────────────────────────────────── */

export async function getRates(): Promise<Rate[]> {
  if (store === 'file') {
    return (readFileStore().rates as unknown as Rate[]).map((r) => ({
      location: r.location,
      nightly: r.nightly ?? null,
      currency: r.currency ?? 'INR',
      updatedAt: r.updatedAt ?? null,
    }));
  }
  await ensureSchema();
  const rows = await sql<{ location: string; nightly: number | null; currency: string; updated_at: Date }>(
    'select * from rates'
  );
  return rows.map((r) => ({
    location: r.location,
    nightly: r.nightly ?? null,
    currency: r.currency,
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null,
  }));
}

export async function setRate(location: string, nightly: number | null): Promise<Rate> {
  const now = new Date().toISOString();
  if (store === 'file') {
    const data = readFileStore();
    const rows = data.rates as unknown as Rate[];
    const existing = rows.find((r) => r.location === location);
    if (existing) {
      existing.nightly = nightly;
      existing.updatedAt = now;
    } else {
      rows.push({ location, nightly, currency: 'INR', updatedAt: now });
    }
    writeFileStore(data);
    return { location, nightly, currency: 'INR', updatedAt: now };
  }

  await ensureSchema();
  const [row] = await sql<{ location: string; nightly: number | null; currency: string; updated_at: Date }>(
    `insert into rates (location, nightly) values ($1, $2)
     on conflict (location) do update set nightly = excluded.nightly, updated_at = now()
     returning *`,
    [location, nightly]
  );
  return {
    location: row.location,
    nightly: row.nightly ?? null,
    currency: row.currency,
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

/* ── Closures ─────────────────────────────────────────────────────────── */

export async function getClosures(location?: string): Promise<Closure[]> {
  if (store === 'file') {
    return (readFileStore().closures as unknown as Closure[])
      .filter((c) => !location || c.location === location)
      .sort((a, b) => a.startsOn.localeCompare(b.startsOn));
  }
  await ensureSchema();
  const rows = location
    ? await sql<{ id: string; location: string; starts_on: Date; ends_on: Date; note: string | null }>(
        'select * from closures where location = $1 order by starts_on',
        [location]
      )
    : await sql<{ id: string; location: string; starts_on: Date; ends_on: Date; note: string | null }>(
        'select * from closures order by starts_on'
      );
  return rows.map((r) => ({
    id: r.id,
    location: r.location,
    startsOn: day(r.starts_on),
    endsOn: day(r.ends_on),
    note: r.note ?? null,
  }));
}

export async function addClosure(input: Omit<Closure, 'id'>): Promise<Closure> {
  const row = { ...input, id: randomUUID() };
  if (store === 'file') {
    const data = readFileStore();
    data.closures.push(row as unknown as Record<string, unknown>);
    writeFileStore(data);
    return row;
  }
  await ensureSchema();
  await sql(
    'insert into closures (id, location, starts_on, ends_on, note) values ($1,$2,$3,$4,$5)',
    [row.id, row.location, row.startsOn, row.endsOn, row.note]
  );
  return row;
}

export async function removeClosure(id: string): Promise<boolean> {
  if (store === 'file') {
    const data = readFileStore();
    const before = data.closures.length;
    data.closures = data.closures.filter((c) => (c as { id?: string }).id !== id);
    writeFileStore(data);
    return data.closures.length < before;
  }
  await ensureSchema();
  const rows = await sql('delete from closures where id = $1 returning id', [id]);
  return rows.length > 0;
}

/** Does any closure at this property cover this day? */
export function isClosed(closures: Closure[], location: string, date: string): boolean {
  return closures.some((c) => c.location === location && date >= c.startsOn && date <= c.endsOn);
}
