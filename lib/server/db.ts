import 'server-only';
import { Pool } from 'pg';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Where the desk's data lives.
 *
 * Everything else on this site is compiled into the build: the rooms, the
 * copy, the photographs. An enquiry is the first thing that arrives *after*
 * the build and has to outlive it, so it needs somewhere to go.
 *
 * ── Two stores, one interface ──────────────────────────────────────────
 * Postgres when `DATABASE_URL` is set — Railway's own Postgres, Supabase,
 * or anything else that speaks the protocol; Supabase *is* Postgres, so it
 * needs no client library of its own and no second code path. A JSON file
 * under `.data/` otherwise, so the panel can be built and used on a laptop
 * without anyone installing a database first.
 *
 * The file store is explicitly a development convenience. It is single
 * process, it rewrites the whole file on every write, and on Railway it
 * would live on a container filesystem that is discarded at each deploy —
 * which is why `health()` reports which of the two is in use, and the panel
 * says so plainly rather than letting anyone discover it by losing a week of
 * enquiries.
 */

export type Store = 'postgres' | 'file';

const url = process.env.DATABASE_URL?.trim();
export const store: Store = url ? 'postgres' : 'file';

/* ── Postgres ─────────────────────────────────────────────────────────── */

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const local = url?.includes('localhost') || url?.includes('127.0.0.1');

    pool = new Pool({
      connectionString: url,
      // Encryption on, verification off. Railway's internal network and
      // Supabase's pooler both present certificates this client cannot chain
      // to a public root, and refusing them would mean refusing the database.
      ssl: local ? undefined : { rejectUnauthorized: false },
      /*
       * Small on purpose.
       *
       * Supabase's transaction pooler counts every client connection against
       * a project-wide limit, and a serverless-style app that opens a pool
       * per instance exhausts it quickly. Four is more than a panel used by
       * a hotel desk will ever need concurrently, and the idle timeout hands
       * them back rather than holding them open between enquiries.
       */
      max: 4,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 8_000,
      // Supabase's pooler closes an idle session eventually; keepalives stop
      // the first query after a quiet hour failing on a dead socket.
      keepAlive: true,
    });

    // A pool error is emitted on the pool, not on the query that caused it.
    // Unhandled, it takes the whole server process down — which is a strange
    // way for a hotel's website to go off the air.
    pool.on('error', (error) => {
      console.error('[db] idle client error', error.message);
    });
  }
  return pool;
}

export async function sql<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await getPool().query(text, params);
  return result.rows as T[];
}

/**
 * Tables, created on first use.
 *
 * A migration runner is a thing worth having when there is a team and a
 * release process. There is one deployment and two tables; this runs on
 * every cold start, costs a few milliseconds, and cannot drift from the code
 * that depends on it.
 */
let ready: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (store === 'file') return Promise.resolve();
  if (!ready) {
    ready = (async () => {
      await sql(`
        create table if not exists enquiries (
          id          text primary key,
          ref         text not null unique,
          name        text not null,
          location    text not null,
          check_in    date,
          check_out   date,
          guests      integer,
          rooms       integer,
          phone       text,
          email       text,
          message     text,
          status      text not null default 'new',
          source      text not null default 'website',
          created_at  timestamptz not null default now(),
          updated_at  timestamptz not null default now()
        )
      `);
      await sql(`create index if not exists enquiries_created_idx on enquiries (created_at desc)`);
      await sql(`create index if not exists enquiries_status_idx on enquiries (status)`);
      await sql(`
        create table if not exists rates (
          location     text primary key,
          nightly      integer,
          currency     text not null default 'INR',
          updated_at   timestamptz not null default now()
        )
      `);
      await sql(`
        create table if not exists closures (
          id          text primary key,
          location    text not null,
          starts_on   date not null,
          ends_on     date not null,
          note        text,
          created_at  timestamptz not null default now()
        )
      `);
      await sql(`create index if not exists closures_location_idx on closures (location, starts_on)`);
    })().catch((error) => {
      // A failed migration must not be cached as "done" — the next request
      // should try again rather than query tables that were never made.
      ready = null;
      throw error;
    });
  }
  return ready;
}

/* ── The file store ───────────────────────────────────────────────────── */

export type FileShape = {
  enquiries: Record<string, unknown>[];
  rates: Record<string, unknown>[];
  closures: Record<string, unknown>[];
};

const FILE = path.join(process.cwd(), '.data', 'vapr.json');
const EMPTY: FileShape = { enquiries: [], rates: [], closures: [] };

export function readFileStore(): FileShape {
  try {
    const raw = fs.readFileSync(FILE, 'utf8');
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<FileShape>) };
  } catch {
    return structuredClone(EMPTY);
  }
}

export function writeFileStore(data: FileShape): void {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  // Written beside the target and renamed: a crash halfway through a write
  // leaves the previous file intact rather than a truncated one.
  const tmp = `${FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, FILE);
}

/** What the panel shows about its own footing. */
export async function health(): Promise<{ store: Store; ok: boolean; detail: string }> {
  if (store === 'file') {
    return {
      store,
      ok: true,
      detail: 'Local file — for development. Nothing written here survives a deploy.',
    };
  }
  try {
    await ensureSchema();
    const [row] = await sql<{ now: string }>('select now() as now');
    return { store, ok: true, detail: `Connected. Server time ${row.now}.` };
  } catch (error) {
    return { store, ok: false, detail: error instanceof Error ? error.message : String(error) };
  }
}
