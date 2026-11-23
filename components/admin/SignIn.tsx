'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError(null);
          const response = await fetch('/api/admin/session', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ password: value }),
          });
          const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
          setBusy(false);
          if (data.ok) {
            setValue('');
            router.refresh();
          } else {
            setError(data.error ?? 'That did not work.');
          }
        }}
        className="w-full max-w-sm rounded-2xl bg-pitch p-8 ring-1 ring-hairline"
      >
        <p className="type-display text-2xl tracking-[0.18em] text-ink">VAPR</p>
        <p className="type-label mt-1 mb-7 text-smoke">The desk</p>

        <label className="block">
          <span className="type-label mb-1 block">Password</span>
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="w-full border-b border-hairline-strong bg-transparent py-2.5 text-lg text-bone transition-colors focus-visible:border-ink focus-visible:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={busy || value.length === 0}
          className="mt-7 w-full rounded-full bg-ink py-3 text-sm font-medium text-paper transition-opacity disabled:opacity-40"
        >
          {busy ? 'Checking…' : 'Sign in'}
        </button>

        <p role="alert" className="mt-3 min-h-5 text-center text-sm text-bone">
          {error}
        </p>
      </form>
    </div>
  );
}
