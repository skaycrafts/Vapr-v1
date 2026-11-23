import SiteShell from '@/components/chrome/SiteShell';
import Footer from '@/components/sections/Footer';
import { jsonLd, siteNodes } from '@/lib/schema';

/**
 * Everything a visitor sees, and nothing the desk does.
 *
 * The shell — Lenis, the entry sequence, the cursor, the grain — used to sit
 * in the root layout, which meant every route in the application inherited
 * it. The admin panel is a route in the same application and wants none of
 * it: smooth-scrolling a table of enquiries, and opening it behind the
 * site's splash, would both be wrong. A route group puts the shell around
 * the public pages only, and changes no URL to do it.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        // Static object under our control; nothing user-supplied reaches it.
        dangerouslySetInnerHTML={{ __html: jsonLd(siteNodes()) }}
      />
      {/* The shell lives here rather than in each page, so Lenis, the
          navigation and the entry sequence survive route changes — the
          sequence plays once per page load, not on every link. */}
      <SiteShell footer={<Footer />}>{children}</SiteShell>
    </>
  );
}
