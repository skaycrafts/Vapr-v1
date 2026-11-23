import { NextResponse } from 'next/server';
import { deskEmail, guestEmail } from '@/lib/server/email-template';
import { signedIn } from '@/lib/server/admin-auth';
import type { Enquiry } from '@/lib/enquiry-shape';

export const dynamic = 'force-dynamic';

/**
 * The letters, rendered in a browser.
 *
 * Mail is the one thing on this site that cannot be checked by looking at
 * the page it came from, so this draws either letter from a sample enquiry.
 * Behind the same gate as the rest of the panel, and it sends nothing.
 */
const SAMPLE: Enquiry = {
  id: 'sample',
  ref: 'V261123-K4QP',
  name: 'Syed Muhith Ibrahim',
  location: 'ashok-nagar',
  checkIn: '2026-09-11',
  checkOut: '2026-09-25',
  guests: 6,
  rooms: 3,
  phone: '+91 78453 91992',
  email: 'guest@example.com',
  message: null,
  status: 'new',
  source: 'website',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export async function GET(request: Request) {
  if (!(await signedIn())) {
    return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 });
  }
  const which = new URL(request.url).searchParams.get('letter');
  const letter = which === 'desk' ? deskEmail(SAMPLE) : guestEmail(SAMPLE);
  return new NextResponse(letter.html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex' },
  });
}
