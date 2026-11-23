/**
 * The shapes the panel and the server agree on.
 *
 * Deliberately free of `server-only`, of `pg`, and of anything that reaches
 * a database: the filter chips and the enquiry cards are client components,
 * and a single runtime import of `STATUSES` from the server module was
 * enough to pull the Postgres driver into the browser bundle. Types erase at
 * compile time and would have been safe; constants do not.
 */

export const STATUSES = ['new', 'contacted', 'booked', 'closed'] as const;
export type Status = (typeof STATUSES)[number];

export type Enquiry = {
  id: string;
  ref: string;
  name: string;
  location: string;
  checkIn: string | null;
  checkOut: string | null;
  guests: number | null;
  rooms: number | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  status: Status;
  source: string;
  createdAt: string;
  updatedAt: string;
};

export type Rate = {
  location: string;
  nightly: number | null;
  currency: string;
  updatedAt: string | null;
};

export type Closure = {
  id: string;
  location: string;
  startsOn: string;
  endsOn: string;
  note: string | null;
};
