-- VAPR — the desk's two tables, and the dates behind them.
--
-- `lib/server/db.ts` creates these itself on first use, so running this file
-- is optional. It exists so the schema can be read, reviewed and restored
-- without going through the application — and so a Supabase project can be
-- set up before the site ever points at it.
--
-- Every statement is `if not exists`: running it twice is safe.

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
);

-- The list is always "newest first", and the panel filters by status.
create index if not exists enquiries_created_idx on enquiries (created_at desc);
create index if not exists enquiries_status_idx  on enquiries (status);

-- One row per property. Null `nightly` means the site says "On enquiry",
-- which is the rule it has always had: no rate set, no price shown.
create table if not exists rates (
  location    text primary key,
  nightly     integer,
  currency    text not null default 'INR',
  updated_at  timestamptz not null default now()
);

-- A range of dates a property is not taking arrivals for.
create table if not exists closures (
  id          text primary key,
  location    text not null,
  starts_on   date not null,
  ends_on     date not null,
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists closures_location_idx on closures (location, starts_on);

-- ── On row level security ─────────────────────────────────────────────
-- Deliberately not enabled, and worth saying why rather than leaving it
-- for someone to discover.
--
-- Nothing reaches these tables except this application's own server, over a
-- connection string that lives in the deployment's environment. There is no
-- browser client, no anon key and no PostgREST call anywhere in the site, so
-- there is no public surface for a policy to protect. If a Supabase client
-- is ever added to the front end, enable RLS on all three tables first and
-- write policies before a single row is read through it.
