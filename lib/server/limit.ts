import 'server-only';

/**
 * A token bucket per address, for the one route the public can post to.
 *
 * In memory on purpose: the alternative is a table write on every request to
 * defend a form that takes a handful of submissions a day. It resets when
 * the container restarts and it does not span instances — both acceptable
 * for what it is guarding, which is a flood, not a determined attacker.
 */

type Bucket = { tokens: number; last: number };

const buckets = new Map<string, Bucket>();
const CAPACITY = 6;        // submissions a visitor may make in a burst
const REFILL_PER_MS = 6 / (60 * 60 * 1000); // and six an hour thereafter

export function allow(key: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { tokens: CAPACITY, last: now };
  bucket.tokens = Math.min(CAPACITY, bucket.tokens + (now - bucket.last) * REFILL_PER_MS);
  bucket.last = now;
  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    return false;
  }
  bucket.tokens -= 1;
  buckets.set(key, bucket);

  // The map is unbounded otherwise: one entry per address, for ever.
  if (buckets.size > 5_000) {
    for (const [k, v] of buckets) if (now - v.last > 60 * 60 * 1000) buckets.delete(k);
  }
  return true;
}

/** Best effort, and only ever used as a rate-limit key. */
export function addressOf(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return (forwarded?.split(',')[0] ?? request.headers.get('x-real-ip') ?? 'unknown').trim();
}
