import { NextResponse } from 'next/server';
import { LOCATIONS } from '@/lib/content';
import { createEnquiry } from '@/lib/server/enquiries';
import { getClosures, isClosed } from '@/lib/server/rates';
import { notifyDesk, notifyGuest } from '@/lib/server/notify';
import { addressOf, allow } from '@/lib/server/limit';

/**
 * Where the enquiry form posts.
 *
 * The only route on this site the public can write to, so everything it is
 * given is treated as hostile: length-capped, type-checked, and matched
 * against the two hotels that exist rather than whatever string arrived.
 * The client's own validation is a convenience for the guest and is assumed
 * absent here.
 */

export const dynamic = 'force-dynamic';

const CAP = { name: 120, phone: 40, email: 160, message: 2000 } as const;

const text = (value: unknown, max: number): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
};

const count = (value: unknown, max: number): number | null => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(n) && n > 0 && n <= max ? n : null;
};

/** `2026-03-04`, and a real day — not the 31st of February. */
const date = (value: unknown): string | null => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const probe = new Date(y, m - 1, d);
  return probe.getFullYear() === y && probe.getMonth() === m - 1 && probe.getDate() === d
    ? value
    : null;
};

export async function POST(request: Request) {
  if (!allow(addressOf(request))) {
    return NextResponse.json(
      { ok: false, error: 'Too many enquiries from this connection. Try again shortly.' },
      { status: 429 }
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'Malformed request.' }, { status: 400 });
  }

  const name = text(payload.name, CAP.name);
  const slug = typeof payload.location === 'string' ? payload.location : '';
  const location = LOCATIONS.find((l) => l.slug === slug);

  if (!name || name.length < 2) {
    return NextResponse.json({ ok: false, error: 'A name is needed.' }, { status: 400 });
  }
  if (!location) {
    return NextResponse.json({ ok: false, error: 'Choose one of the two hotels.' }, { status: 400 });
  }

  const phone = text(payload.phone, CAP.phone);
  const email = text(payload.email, CAP.email);
  if (!phone && !email) {
    return NextResponse.json(
      { ok: false, error: 'A phone number or an email address is needed.' },
      { status: 400 }
    );
  }

  const checkIn = date(payload.checkIn);
  const checkOut = date(payload.checkOut);
  if (checkIn && checkOut && checkOut <= checkIn) {
    return NextResponse.json(
      { ok: false, error: 'The departure has to be after the arrival.' },
      { status: 400 }
    );
  }

  // A night the hotel has already said it cannot take. Better to say so here
  // than to let the desk ring back with the same answer tomorrow.
  if (checkIn) {
    const closures = await getClosures(location.slug);
    if (isClosed(closures, location.slug, checkIn)) {
      return NextResponse.json(
        {
          ok: false,
          error: `${location.shortName} is not taking arrivals on that date. Try another, or write to the desk.`,
        },
        { status: 409 }
      );
    }
  }

  const enquiry = await createEnquiry({
    name,
    location: location.slug,
    checkIn,
    checkOut,
    guests: count(payload.guests, 20),
    rooms: count(payload.rooms, 10),
    phone,
    email,
    message: text(payload.message, CAP.message),
  });

  /*
   * Two letters, sent together and neither allowed to fail the request.
   *
   * The desk's copy is the one that has to arrive; the guest's is the
   * acknowledgement the closing screen promises. Both are awaited — a second
   * of latency is worth the guest seeing "sent" and meaning it — and both
   * report rather than throw, because the enquiry is already saved and a
   * mail provider having a bad minute must not take it down with it.
   */
  const [desk, guest] = await Promise.all([notifyDesk(enquiry), notifyGuest(enquiry)]);

  return NextResponse.json({
    ok: true,
    ref: enquiry.ref,
    notified: desk.sent,
    acknowledged: guest.sent,
  });
}
