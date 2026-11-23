import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * The gate on the panel, and why it is optional.
 *
 * The desk asked for no sign-in "for now", and no sign-in is what this is
 * when `ADMIN_PASSWORD` is unset: the panel opens for anyone with the URL.
 * That is a defensible choice while the only thing behind it is an empty
 * table, and an indefensible one the moment a guest's name, telephone
 * number and travel dates are sitting in it — which is the whole purpose of
 * the thing. So the lock is built, costs one environment variable to turn
 * on, and the panel says loudly that it is off until it is.
 *
 * One password, no accounts. It cannot tell who did what, and that is the
 * trade the desk chose; what it does do is keep a public URL from being a
 * public list of customers.
 */

const COOKIE = 'vapr_admin';
const MAX_AGE = 60 * 60 * 12; // A working day, then sign in again.

export const password = () => process.env.ADMIN_PASSWORD?.trim() || null;
export const isLocked = () => password() !== null;

/**
 * The cookie is the password's signature over its own expiry, not the
 * password itself: a cookie that leaks is useless after it expires, and a
 * changed password invalidates every cookie ever issued.
 */
function sign(expires: number, secret: string): string {
  return createHmac('sha256', secret).update(String(expires)).digest('hex');
}

export function issue(secret: string): { value: string; maxAge: number } {
  const expires = Date.now() + MAX_AGE * 1000;
  return { value: `${expires}.${sign(expires, secret)}`, maxAge: MAX_AGE };
}

function valid(token: string | undefined, secret: string): boolean {
  if (!token) return false;
  const [stamp, mac] = token.split('.');
  const expires = Number(stamp);
  if (!Number.isFinite(expires) || expires < Date.now() || !mac) return false;
  const expected = sign(expires, secret);
  const a = Buffer.from(mac, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Constant-time compare, so the password cannot be guessed a letter at a time. */
export function matches(attempt: string, secret: string): boolean {
  const a = Buffer.from(attempt, 'utf8');
  const b = Buffer.from(secret, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function signedIn(): Promise<boolean> {
  const secret = password();
  if (!secret) return true; // No lock configured: the panel is open.
  const jar = await cookies();
  return valid(jar.get(COOKIE)?.value, secret);
}

export const cookieName = COOKIE;
