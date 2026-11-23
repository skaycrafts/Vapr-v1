import 'server-only';
import { randomUUID } from 'node:crypto';
import { ensureSchema, readFileStore, sql, store, writeFileStore } from './db';
import { STATUSES as STATUS_VALUES, type Enquiry, type Status } from '@/lib/enquiry-shape';

/**
 * The enquiry, from the form to the desk.
 *
 * Until now the form composed a message and handed it to the guest's own
 * WhatsApp or mail app — and with neither configured, to their clipboard,
 * which meant the enquiry reached nobody while the closing screen promised a
 * call within thirty minutes. This is the other half of that promise.
 */

export { STATUSES } from '@/lib/enquiry-shape';
export type { Enquiry, Status } from '@/lib/enquiry-shape';

export type NewEnquiry = {
  name: string;
  location: string;
  checkIn?: string | null;
  checkOut?: string | null;
  guests?: number | null;
  rooms?: number | null;
  phone?: string | null;
  email?: string | null;
  message?: string | null;
  source?: string;
};

/**
 * A short human reference, for saying out loud on the telephone.
 *
 * Date-prefixed so the desk can tell this morning's from last month's at a
 * glance, and four random characters from an alphabet with no I, O, 0 or 1
 * in it — the reference is read down a line as often as it is clicked.
 */
const ALPHABET = 'ACDEFGHJKLMNPQRSTUVWXYZ23456789';

function makeRef(): string {
  const now = new Date();
  const stamp = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  let tail = '';
  for (let i = 0; i < 4; i += 1) {
    tail += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `V${stamp}-${tail}`;
}

type Row = {
  id: string;
  ref: string;
  name: string;
  location: string;
  check_in: string | Date | null;
  check_out: string | Date | null;
  guests: number | null;
  rooms: number | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  status: string;
  source: string;
  created_at: string | Date;
  updated_at: string | Date;
};

/** Postgres hands back `Date` for date columns; the panel wants plain days. */
const day = (value: string | Date | null): string | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }
  return String(value).slice(0, 10);
};

const iso = (value: string | Date): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const hydrate = (row: Row): Enquiry => ({
  id: row.id,
  ref: row.ref,
  name: row.name,
  location: row.location,
  checkIn: day(row.check_in),
  checkOut: day(row.check_out),
  guests: row.guests ?? null,
  rooms: row.rooms ?? null,
  phone: row.phone ?? null,
  email: row.email ?? null,
  message: row.message ?? null,
  status: (STATUS_VALUES as readonly string[]).includes(row.status) ? (row.status as Status) : 'new',
  source: row.source,
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
});

export async function createEnquiry(input: NewEnquiry): Promise<Enquiry> {
  const now = new Date().toISOString();
  const row: Row = {
    id: randomUUID(),
    ref: makeRef(),
    name: input.name,
    location: input.location,
    check_in: input.checkIn ?? null,
    check_out: input.checkOut ?? null,
    guests: input.guests ?? null,
    rooms: input.rooms ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    message: input.message ?? null,
    status: 'new',
    source: input.source ?? 'website',
    created_at: now,
    updated_at: now,
  };

  if (store === 'file') {
    const data = readFileStore();
    data.enquiries.unshift(row as unknown as Record<string, unknown>);
    writeFileStore(data);
    return hydrate(row);
  }

  await ensureSchema();
  const [saved] = await sql<Row>(
    `insert into enquiries
       (id, ref, name, location, check_in, check_out, guests, rooms, phone, email, message, source)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     returning *`,
    [
      row.id, row.ref, row.name, row.location, row.check_in, row.check_out,
      row.guests, row.rooms, row.phone, row.email, row.message, row.source,
    ]
  );
  return hydrate(saved);
}

export async function listEnquiries(options: { status?: Status | 'all'; limit?: number } = {}) {
  const limit = Math.min(Math.max(options.limit ?? 200, 1), 500);
  const status = options.status && options.status !== 'all' ? options.status : null;

  if (store === 'file') {
    const rows = readFileStore().enquiries as unknown as Row[];
    return rows
      .filter((r) => !status || r.status === status)
      .sort((a, b) => iso(b.created_at).localeCompare(iso(a.created_at)))
      .slice(0, limit)
      .map(hydrate);
  }

  await ensureSchema();
  const rows = status
    ? await sql<Row>(
        'select * from enquiries where status = $1 order by created_at desc limit $2',
        [status, limit]
      )
    : await sql<Row>('select * from enquiries order by created_at desc limit $1', [limit]);
  return rows.map(hydrate);
}

export async function setStatus(id: string, status: Status): Promise<Enquiry | null> {
  if (store === 'file') {
    const data = readFileStore();
    const rows = data.enquiries as unknown as Row[];
    const row = rows.find((r) => r.id === id);
    if (!row) return null;
    row.status = status;
    row.updated_at = new Date().toISOString();
    writeFileStore(data);
    return hydrate(row);
  }

  await ensureSchema();
  const [row] = await sql<Row>(
    'update enquiries set status = $2, updated_at = now() where id = $1 returning *',
    [id, status]
  );
  return row ? hydrate(row) : null;
}

export async function deleteEnquiry(id: string): Promise<boolean> {
  if (store === 'file') {
    const data = readFileStore();
    const before = data.enquiries.length;
    data.enquiries = data.enquiries.filter((r) => (r as { id?: string }).id !== id);
    writeFileStore(data);
    return data.enquiries.length < before;
  }

  await ensureSchema();
  const rows = await sql('delete from enquiries where id = $1 returning id', [id]);
  return rows.length > 0;
}

/** The counts the dashboard opens with. */
export async function counts(): Promise<Record<Status | 'total', number>> {
  const all = await listEnquiries({ limit: 500 });
  const base = { new: 0, contacted: 0, booked: 0, closed: 0, total: all.length };
  for (const enquiry of all) base[enquiry.status] += 1;
  return base;
}
