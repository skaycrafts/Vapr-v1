import SiteShell from '@/components/chrome/SiteShell';
import Footer from '@/components/sections/Footer';
import { CONTACT, LOCATIONS, SITE } from '@/lib/content';

/**
 * Brand-level schema only. Each property carries its own `Hotel` entity on its
 * own page, which is where an address belongs.
 */
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE.legalName,
  alternateName: SITE.name,
  description: SITE.description,
  url: SITE.url,
  // Emitted only when configured. Structured data asserting a telephone
  // number of zeroes is a machine-readable lie, and search engines keep it.
  ...(CONTACT.phone ? { telephone: CONTACT.phone } : {}),
  ...(CONTACT.email ? { email: CONTACT.email } : {}),
  areaServed: SITE.city,
  subOrganization: LOCATIONS.map((l) => ({
    '@type': 'Hotel',
    name: l.name,
    url: `${SITE.url}/${l.slug}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: l.street,
      addressLocality: `${l.area}, ${SITE.city}`,
      addressRegion: SITE.region,
      postalCode: l.postalCode,
      addressCountry: SITE.country,
    },
  })),
};

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* The shell lives here rather than in each page, so Lenis, the
          navigation and the entry sequence survive route changes — the
          sequence plays once per page load, not on every link. */}
      <SiteShell footer={<Footer />}>{children}</SiteShell>
    </>
  );
}
