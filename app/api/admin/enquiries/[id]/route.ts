import { NextResponse } from 'next/server';
import { deleteEnquiry, setStatus, STATUSES, type Status } from '@/lib/server/enquiries';
import { signedIn } from '@/lib/server/admin-auth';

export const dynamic = 'force-dynamic';

/** Next 16 hands route params in as a promise. */
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  if (!(await signedIn())) {
    return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 });
  }
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { status?: string };
  if (!(STATUSES as readonly string[]).includes(body.status ?? '')) {
    return NextResponse.json({ ok: false, error: 'Unknown status.' }, { status: 400 });
  }
  const enquiry = await setStatus(id, body.status as Status);
  return enquiry
    ? NextResponse.json({ ok: true, enquiry })
    : NextResponse.json({ ok: false, error: 'No such enquiry.' }, { status: 404 });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  if (!(await signedIn())) {
    return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 });
  }
  const { id } = await params;
  return NextResponse.json({ ok: await deleteEnquiry(id) });
}
