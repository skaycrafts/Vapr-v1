import { NextResponse } from 'next/server';
import { LOCATIONS } from '@/lib/content';
import { addClosure, getClosures, getRates, setRate } from '@/lib/server/rates';
import { signedIn } from '@/lib/server/admin-auth';

export const dynamic = 'force-dynamic';

const known = (slug: unknown) => LOCATIONS.some((l) => l.slug === slug);

export async function GET() {
  if (!(await signedIn())) {
    return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 });
  }
  const [rates, closures] = await Promise.all([getRates(), getClosures()]);
  return NextResponse.json({ ok: true, rates, closures });
}

/** Set — or clear — one property's nightly rate. */
export async function PUT(request: Request) {
  if (!(await signedIn())) {
    return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { location?: string; nightly?: unknown };
  if (!known(body.location)) {
    return NextResponse.json({ ok: false, error: 'Unknown property.' }, { status: 400 });
  }

  // Null clears it, and the site goes back to "On enquiry" — the rule the
  // site has always had: no rate set, no price shown.
  let nightly: number | null = null;
  if (body.nightly !== null && body.nightly !== undefined && body.nightly !== '') {
    const n = Math.round(Number(body.nightly));
    if (!Number.isFinite(n) || n <= 0 || n > 1_000_000) {
      return NextResponse.json({ ok: false, error: 'That is not a rate.' }, { status: 400 });
    }
    nightly = n;
  }
  return NextResponse.json({ ok: true, rate: await setRate(body.location as string, nightly) });
}

/** Close a range of dates at one property. */
export async function POST(request: Request) {
  if (!(await signedIn())) {
    return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    location?: string; startsOn?: string; endsOn?: string; note?: string;
  };
  const day = /^\d{4}-\d{2}-\d{2}$/;
  if (!known(body.location)) {
    return NextResponse.json({ ok: false, error: 'Unknown property.' }, { status: 400 });
  }
  if (!day.test(body.startsOn ?? '') || !day.test(body.endsOn ?? '')) {
    return NextResponse.json({ ok: false, error: 'Two dates are needed.' }, { status: 400 });
  }
  if ((body.endsOn as string) < (body.startsOn as string)) {
    return NextResponse.json({ ok: false, error: 'The range ends before it starts.' }, { status: 400 });
  }
  const closure = await addClosure({
    location: body.location as string,
    startsOn: body.startsOn as string,
    endsOn: body.endsOn as string,
    note: body.note?.trim().slice(0, 160) || null,
  });
  return NextResponse.json({ ok: true, closure });
}
