import type { Metadata } from 'next';
import Link from 'next/link';
import { currentUser, mode, signedIn } from '@/lib/server/admin-auth';
import { store } from '@/lib/server/db';
import SignIn from '@/components/admin/SignIn';
import AdminNav from '@/components/admin/AdminNav';
import SignOut from '@/components/admin/SignOut';

/**
 * The desk's side of the site.
 *
 * It does not sit inside the public shell — no Lenis, no entry sequence, no
 * cursor, no grain. Those exist to make a hotel feel like somewhere; this is
 * a tool for the person answering the telephone, and the only thing it owes
 * them is that the enquiry is legible in one glance and two clicks from
 * being dealt with.
 *
 * It keeps the site's type and colour so it is recognisably the same
 * business, and inverts the arrangement: ink rail, paper page, because a
 * table of names read all day wants a white ground.
 */
export const metadata: Metadata = {
  title: 'Desk — VAPR',
  // Never indexed, whatever robots.txt says, and whatever the lock is set to.
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const how = mode();
  const allowed = await signedIn();
  const who = await currentUser();

  if (!allowed) {
    // The sign-in card owns the whole screen, and is told which credentials
    // the server will actually check so it can ask for those and no others.
    return (
      <div className="on-paper min-h-screen">
        <SignIn mode={how === 'supabase' ? 'supabase' : 'password'} />
      </div>
    );
  }

  return (
    <div className="on-paper min-h-screen bg-paper text-ink md:grid md:grid-cols-[232px_1fr]">
      <aside className="on-ink flex flex-col gap-8 bg-paper px-5 py-6 md:sticky md:top-0 md:h-screen">
        <div>
          <p className="type-display text-2xl tracking-[0.18em] text-ink">VAPR</p>
          <p className="type-label mt-1 text-smoke">The desk</p>
        </div>

        <AdminNav />

        <div className="mt-auto space-y-3 border-t border-hairline pt-4">
          <Link
            href="/"
            className="block text-sm text-mist transition-colors hover:text-ink"
            target="_blank"
            rel="noreferrer"
          >
            Open the website ↗
          </Link>
          {who ? (
            <div className="space-y-1">
              <p className="truncate text-xs text-smoke" title={who}>
                {who}
              </p>
              <SignOut />
            </div>
          ) : null}
        </div>
      </aside>

      <main className="min-w-0 px-5 py-8 md:px-10 md:py-12">
        {/*
          Two things the desk must not have to discover for themselves: that
          the panel is open to anyone with the address, and that what they
          are typing into is a development file rather than a database.
        */}
        {how === 'open' ? (
          <p className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-ink">
            <b>No sign-in is configured.</b> Anyone with this address can read every guest&rsquo;s
            name and telephone number. Set <code className="tabular">SUPABASE_URL</code> and{' '}
            <code className="tabular">SUPABASE_ANON_KEY</code> to use the project&rsquo;s own users,
            or <code className="tabular">ADMIN_PASSWORD</code> for a single shared one.
          </p>
        ) : null}
        {store === 'file' ? (
          <p className="mb-6 rounded-xl border border-hairline-strong bg-glass px-4 py-3 text-sm text-mist">
            <b className="text-ink">Local file store.</b> No database is attached, so enquiries are
            written to <code className="tabular">.data/vapr.json</code> and will not survive a deploy.
            Attach Postgres in Railway and this becomes permanent on its own.
          </p>
        ) : null}
        {children}
      </main>
    </div>
  );
}
