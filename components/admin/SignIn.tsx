'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The way in.
 *
 * The reference for this was The Roost's — a card floating on a radial wash
 * of the brand's own colour — and the shape is the same because the shape is
 * right: one card, centred, nothing else on the screen to think about.
 * Everything else is VAPR's. Ink where that was maroon, the Didone wordmark
 * with the tracking it carries on the site, and a paper card rather than a
 * tinted glass one, because this site's whole arrangement is paper laid on
 * ink and a sign-in is no place to introduce a third material.
 *
 * The email field disappears where the deployment uses a single shared
 * password instead of Supabase's users, so the form always asks for exactly
 * what the server will check.
 */
export default function SignIn({ mode }: { mode: 'supabase' | 'password' }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [shown, setShown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ready = mode === 'supabase' ? email.trim() !== '' && secret !== '' : secret !== '';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError(null);

    const response = await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(mode === 'supabase' ? { email, password: secret } : { password: secret }),
    }).catch(() => null);

    const data = (await response?.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    setBusy(false);

    if (data?.ok) {
      setSecret('');
      router.refresh();
      return;
    }
    setError(data?.error ?? 'Could not reach the server. Try again.');
  };

  const field =
    'w-full rounded-xl border border-hairline-strong bg-paper px-4 py-3 text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-smoke focus:border-ink focus:ring-2 focus:ring-ink/15';

  return (
    /*
     * The ground is a wash rather than a flat black: a soft pool of light
     * behind the card, the way the hero's mark sits in one. Flat ink under a
     * paper card reads as a dialog on an error page.
     */
    <div
      className="flex min-h-screen items-center justify-center px-5 py-10"
      style={{
        background:
          'radial-gradient(1100px 760px at 50% -12%, #22252A 0%, #121416 48%, #0B0C0D 100%)',
      }}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl bg-paper p-9 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.75)] ring-1 ring-black/5"
      >
        <div className="text-center">
          <p className="type-display text-[1.75rem] leading-none tracking-[0.2em] text-ink">VAPR</p>
          <p className="type-label mt-2.5 text-smoke">The desk</p>
        </div>

        <div className="mt-9 space-y-4">
          {mode === 'supabase' ? (
            <label className="block">
              <span className="type-label mb-1.5 block">Email</span>
              <input
                type="email"
                autoFocus
                autoComplete="username"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={field}
              />
            </label>
          ) : null}

          <label className="block">
            <span className="type-label mb-1.5 block">Password</span>
            <div className="relative">
              <input
                type={shown ? 'text' : 'password'}
                autoFocus={mode === 'password'}
                autoComplete="current-password"
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                className={cn(field, 'pr-12')}
              />
              {/*
                A reveal, because a password typed wrong on a phone at a desk
                is the most ordinary reason to be locked out of anything.
              */}
              <button
                type="button"
                onClick={() => setShown((current) => !current)}
                aria-label={shown ? 'Hide password' : 'Show password'}
                className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-smoke transition-colors hover:text-ink"
              >
                {shown ? (
                  <EyeOff size={17} strokeWidth={1.75} aria-hidden />
                ) : (
                  <Eye size={17} strokeWidth={1.75} aria-hidden />
                )}
              </button>
            </div>
          </label>
        </div>

        <button
          type="submit"
          disabled={!ready || busy}
          className="mt-7 w-full rounded-full bg-ink py-3.5 text-sm font-medium text-paper transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.99] disabled:opacity-35 disabled:active:scale-100"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        {/* Reserved height, so the card does not jump when it answers. */}
        <p role="alert" className="mt-3.5 min-h-[1.25rem] text-center text-sm text-bone">
          {error}
        </p>
      </form>
    </div>
  );
}
