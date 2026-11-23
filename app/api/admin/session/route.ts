import { NextResponse } from 'next/server';
import {
  cookieName,
  matches,
  mode,
  newSession,
  password,
  verifyWithSupabase,
} from '@/lib/server/admin-auth';
import { addressOf, allow } from '@/lib/server/limit';

export const dynamic = 'force-dynamic';

/**
 * Signing in and out.
 *
 * Rate-limited on its own bucket, so a hundred guesses against the desk's
 * password cannot be made in a minute — and so that someone doing it cannot
 * also exhaust the public form's allowance on the way.
 */
export async function POST(request: Request) {
  const how = mode();
  if (how === 'open') {
    return NextResponse.json({ ok: true, locked: false });
  }

  if (!allow(`admin:${addressOf(request)}`)) {
    return NextResponse.json(
      { ok: false, error: 'Too many attempts. Wait a few minutes.' },
      { status: 429 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };
  const pass = typeof body.password === 'string' ? body.password : '';

  let who: string;

  if (how === 'supabase') {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email || !pass) {
      return NextResponse.json(
        { ok: false, error: 'An email and a password are needed.' },
        { status: 400 }
      );
    }
    const result = await verifyWithSupabase(email, pass);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 401 });
    }
    who = result.who;
  } else {
    const expected = password();
    if (!expected || !matches(pass, expected)) {
      return NextResponse.json({ ok: false, error: 'That is not the password.' }, { status: 401 });
    }
    who = 'the desk';
  }

  const session = newSession(who);
  if (!session) {
    // Signing needs a secret. Saying so is better than issuing a cookie that
    // cannot be verified and leaving someone at a login screen that loops.
    return NextResponse.json(
      { ok: false, error: 'Sessions are not configured on the server.' },
      { status: 500 }
    );
  }

  const response = NextResponse.json({ ok: true, who });
  /*
   * No `maxAge`, deliberately: this is a browser-session cookie, gone when
   * the browser closes. The signature carries its own twelve-hour ceiling,
   * so a cookie copied out of a machine still expires on its own.
   */
  response.cookies.set(cookieName, session.value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, '', { path: '/', maxAge: 0 });
  return response;
}
