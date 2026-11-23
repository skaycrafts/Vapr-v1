import { NextResponse } from 'next/server';
import { cookieName, isLocked, issue, matches, password } from '@/lib/server/admin-auth';
import { addressOf, allow } from '@/lib/server/limit';

export const dynamic = 'force-dynamic';

/** Sign in. Rate-limited on the same bucket as the public form. */
export async function POST(request: Request) {
  const secret = password();
  if (!isLocked() || !secret) {
    return NextResponse.json({ ok: true, locked: false });
  }
  if (!allow(`admin:${addressOf(request)}`)) {
    return NextResponse.json({ ok: false, error: 'Too many attempts.' }, { status: 429 });
  }
  const body = (await request.json().catch(() => ({}))) as { password?: string };
  if (typeof body.password !== 'string' || !matches(body.password, secret)) {
    return NextResponse.json({ ok: false, error: 'That is not the password.' }, { status: 401 });
  }
  const token = issue(secret);
  const response = NextResponse.json({ ok: true, locked: true });
  response.cookies.set(cookieName, token.value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: token.maxAge,
  });
  return response;
}

/** Sign out. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, '', { path: '/', maxAge: 0 });
  return response;
}
