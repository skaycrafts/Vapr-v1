import type { Metadata, Viewport } from 'next';
import { Bodoni_Moda, Archivo } from 'next/font/google';
import { CONTACT, LOCATIONS, SITE } from '@/lib/content';
import SiteShell from '@/components/chrome/SiteShell';
import Footer from '@/components/sections/Footer';
import './globals.css';

/**
 * The wordmark in the VAPR emblem is a high-contrast Didone. Bodoni Moda is
 * the closest free match, so the display face and the logo speak the same
 * language rather than arguing.
 */
const bodoni = Bodoni_Moda({
  subsets: ['latin'],
  axes: ['opsz'],
  // The italic is loaded for exactly one line — the second half of the hero
  // statement. A Didone italic against its own roman is the sharpest contrast
  // the family offers, and it is the difference between a headline that is
  // set and one that is spoken. Used once, on purpose; a site that italicises
  // freely has no emphasis left to spend.
  style: ['normal', 'italic'],
  variable: '--font-bodoni',
  display: 'swap',
});

/**
 * Archivo carries a width axis, which supplies the contrast a second family
 * usually would — wide for headings, normal for text — without pairing two
 * grotesques that are similar but not identical.
 */
const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-archivo',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    locale: 'en_IN',
    images: [{ url: '/media/img/facade-dusk-1600.webp', width: 1600, height: 1067, alt: SITE.tagline }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: ['/media/img/facade-dusk-1600.webp'],
  },
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#111111',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${bodoni.variable} ${archivo.variable}`}>
      <body>
        <script
          type="application/ld+json"
          // Static object under our control; nothing user-supplied reaches it.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* The shell lives here rather than in each page, so Lenis, the
            navigation and the entry sequence survive route changes — the
            sequence plays once per page load, not on every link. */}
        <SiteShell footer={<Footer />}>{children}</SiteShell>
      </body>
    </html>
  );
}
