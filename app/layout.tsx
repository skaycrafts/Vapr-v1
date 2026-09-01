import type { Metadata, Viewport } from 'next';
import { Bodoni_Moda, Archivo } from 'next/font/google';
import { SITE, needsVerification } from '@/lib/content';
import './globals.css';

/**
 * The wordmark in the VAPR emblem is a high-contrast Didone. Bodoni Moda is
 * the closest free match, so the display face and the logo speak the same
 * language rather than arguing.
 */
const bodoni = Bodoni_Moda({
  subsets: ['latin'],
  axes: ['opsz'],
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
    default: `${SITE.name} — ${SITE.locality}, ${SITE.city}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.locality}, ${SITE.city}`,
    description: SITE.description,
    locale: 'en_IN',
    images: [{ url: '/media/img/facade-dusk-1600.webp', width: 1600, height: 1067, alt: SITE.tagline }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} — ${SITE.locality}, ${SITE.city}`,
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

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Hotel',
  name: SITE.legalName,
  description: SITE.description,
  url: SITE.url,
  telephone: needsVerification.phone,
  email: needsVerification.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: SITE.street,
    addressLocality: `${SITE.locality}, ${SITE.city}`,
    addressRegion: SITE.region,
    postalCode: SITE.postalCode,
    addressCountry: SITE.country,
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: needsVerification.coordinates.lat,
    longitude: needsVerification.coordinates.lng,
  },
  amenityFeature: [
    'Air conditioning',
    'Covered parking',
    'Breakfast service',
    'Conference room',
    '24-hour reception',
    'Lift access',
  ].map((name) => ({ '@type': 'LocationFeatureSpecification', name, value: true })),
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
        {children}
      </body>
    </html>
  );
}
