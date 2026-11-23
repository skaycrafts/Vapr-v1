import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * Who may open the desk.
 *
 * Three rungs, and the panel says plainly which one it is standing on:
 *
 *   supabase — email and password, checked against the project's own
 *              Authentication users. What the desk actually has.
 *   password — one shared `ADMIN_PASSWORD`, no accounts. The earlier
 *              arrangement, kept because a deployment with Supabase
 *              misconfigured should fall back to a lock rather than to none.
 *   open     — neither configured. The panel opens for anyone with the URL
 *              and carries a standing warning saying so.
 *
 * ── Why the session is ours and not Supabase's ────────────────────────
 * Supabase hands back an access token good for an hour and a refresh token
 * to extend it. Refreshing has to happen somewhere, and in this framework a
 * page render cannot set a cookie — only a route handler can — so a desk
 * would be signed out mid-shift with no way to renew quietly.
 *
 * So Supabase answers one question, once: are these credentials real? After
 * that this issues its own cookie: the signed-in address and an expiry,
 * signed with a server-side secret. No token to refresh, no credential at
 * rest in the browser, and a fixed twelve hours that matches a shift rather
 * than an hour that matches nothing.
 */

const COOKIE = 'vapr_admin';
const MAX_AGE = 60 * 60 * 12;

export type Mode = 'supabase' | 'password' | 'open';

const env = (name: string) => process.env[name]?.trim() || null;

export const supabaseUrl = () => env('SUPABASE_URL')?.replace(/\/+$/, '') || null;
export const supabaseKey = () => env('SUPABASE_ANON_KEY') || env('SUPABASE_PUBLISHABLE_KEY');
export const password = () => env('ADMIN_PASSWORD');

export function mode(): Mode {
  if (supabaseUrl() && supabaseKey()) return 'supabase';
  if (password()) return 'password';
  return 'open';
}

export const isLocked = () => mode() !== 'open';

/**
 * What the session cookie is signed with.
 *
 * `ADMIN_SESSION_SECRET` if it is set. Otherwise `DATABASE_URL`, which is
 * already present, is server-side only, and contains the database password
 * — rotate it and every open session ends, which is the correct behaviour
 * rather than an accident.
 *
 * Never the Supabase publishable key: it is published by design, and a
 * signing key anyone can read is a signature anyone can forge.
 */
function secret(): string | null {
  return env('ADMIN_SESSION_SECRET') || env('DATABASE_URL') || password();
}

const sign = (payload: string, key: string) =>
  createHmac('sha256', key).update(payload).digest('hex');

const safeEqual = (a: string, b: string) => {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  return left.length === right.length && timingSafeEqual(left, right);
};

/** `<expiry>.<who>.<signature>` — the address is carried so the panel can show it. */
function issue(who: string, key: string): { value: string; maxAge: number } {
  const expires = Date.now() + MAX_AGE * 1000;
  const who64 = Buffer.from(who, 'utf8').toString('base64url');
  const payload = `${expires}.${who64}`;
  return { value: `${payload}.${sign(payload, key)}`, maxAge: MAX_AGE };
}

function read(token: string | undefined, key: string): { who: string } | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [stamp, who64, mac] = parts;
  const expires = Number(stamp);
  if (!Number.isFinite(expires) || expires < Date.now()) return null;
  if (!safeEqual(mac, sign(`${stamp}.${who64}`, key))) return null;
  try {
    return { who: Buffer.from(who64, 'base64url').toString('utf8') };
  } catch {
    return null;
  }
}

/** Constant-time compare, so a shared password cannot be guessed a letter at a time. */
export const matches = (attempt: string, expected: string) => safeEqual(attempt, expected);

/* ── Supabase ─────────────────────────────────────────────────────────── */

export type SignInResult = { ok: true; who: string } | { ok: false; error: string };

/**
 * Asks Supabase whether this is one of its users. The key used is the
 * publishable one, which is what this endpoint expects; the request is made
 * from the server so the browser is never handed either the key or a token.
 */
export async function verifyWithSupabase(email: string, pass: string): Promise<SignInResult> {
  const url = supabaseUrl();
  const key = supabaseKey();
  if (!url || !key) return { ok: false, error: 'Sign-in is not configured.' };

  try {
    const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: key, 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    });

    if (response.ok) {
      const data = (await response.json()) as { user?: { email?: string } };
      return { ok: true, who: data.user?.email ?? email };
    }

    // Supabase distinguishes a wrong password from an unconfirmed address;
    // the desk can act on the second and not on the first.
    const detail = (await response.json().catch(() => ({}))) as {
      error_description?: string; msg?: string; error_code?: string;
    };
    const code = detail.error_code ?? '';
    if (code === 'email_not_confirmed') {
      return { ok: false, error: 'That address has not been confirmed yet.' };
    }
    if (response.status === 400 || response.status === 401) {
      return { ok: false, error: 'That email and password do not match.' };
    }
    return { ok: false, error: detail.error_description ?? detail.msg ?? 'Sign-in failed.' };
  } catch {
    return { ok: false, error: 'Could not reach the sign-in service. Try again.' };
  }
}

/* ── The session ──────────────────────────────────────────────────────── */

export function newSession(who: string): { value: string; maxAge: number } | null {
  const key = secret();
  return key ? issue(who, key) : null;
}

/** The signed-in address, or null. `null` with mode `open` means no lock at all. */
export async function currentUser(): Promise<string | null> {
  if (mode() === 'open') return null;
  const key = secret();
  if (!key) return null;
  const jar = await cookies();
  return read(jar.get(COOKIE)?.value, key)?.who ?? null;
}

export async function signedIn(): Promise<boolean> {
  if (mode() === 'open') return true;
  return (await currentUser()) !== null;
}

export const cookieName = COOKIE;
