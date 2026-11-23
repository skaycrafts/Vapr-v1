import type { Metadata, Viewport } from 'next';
import { Bodoni_Moda, Inter_Tight, Pinyon_Script } from 'next/font/google';
import { SEO, SITE } from '@/lib/content';
import { renditionOf } from '@/lib/media';
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
 * The working face: body copy, labels, buttons, fields, numerals.
 *
 * Archivo was here, chosen for a width axis that stood in for a second
 * family. There are three families now, so nothing has to stand in for
 * anything, and what this one has to be is quiet — a plain grotesque that
 * holds a paragraph without competing with the Didone above it. Inter Tight
 * is that. Losing Archivo's width axis costs `type-wide`, which is set with
 * weight and tracking instead.
 */
const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  display: 'swap',
});

/**
 * The third voice, and the one with the strictest rules.
 *
 * Every one of the reference boards runs the same three-part recipe: a Didone
 * carrying the idea, a formal copperplate taking exactly one word beside it,
 * and a plain grotesque underneath. This is that copperplate.
 *
 * One weight, one subset, and it is loaded for a handful of words — a script
 * used more than that stops being emphasis and becomes a theme, which is the
 * failure mode this face has. `display: swap` matters more here than
 * anywhere: it is the largest type on the page it appears on, so a blocking
 * load would hold the whole line.
 */
const pinyon = Pinyon_Script({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-pinyon',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SEO.title,
    template: `%s — ${SITE.name}`,
  },
  description: SEO.description,
  applicationName: SITE.name,
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title: SEO.title,
    description: SEO.description,
    locale: 'en_IN',
    // Dimensions from the manifest rather than typed in: this said 1067 tall
    // for a frame that is 704, and platforms that trust the declared size
    // crop to it.
    images: [{ ...renditionOf('facade-dusk'), alt: SITE.tagline }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO.title,
    description: SEO.description,
    images: [renditionOf('facade-dusk').url],
  },
  // No canonical here. Set at the root it was inherited by every route that
  // did not set its own — the admin desk and the 404 both claimed to be the
  // homepage. The homepage and each property declare their own.
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  // The first paint is the overture and the hero, both of which kept the
  // black. The body underneath is paper, so `color-scheme` is light and the
  // sections that stay dark declare their own inside `.on-ink`.
  themeColor: '#0B0F10',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${bodoni.variable} ${interTight.variable} ${pinyon.variable}`}>
      <body>{children}</body>
    </html>
  );
}
