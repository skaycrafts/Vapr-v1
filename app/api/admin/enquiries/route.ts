import { NextResponse } from 'next/server';
import { listEnquiries, STATUSES, type Status } from '@/lib/server/enquiries';
import { signedIn } from '@/lib/server/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!(await signedIn())) {
    return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 });
  }
  const asked = new URL(request.url).searchParams.get('status');
  const status = (STATUSES as readonly string[]).includes(asked ?? '')
    ? (asked as Status)
    : 'all';
  return NextResponse.json({ ok: true, enquiries: await listEnquiries({ status }) });
}
