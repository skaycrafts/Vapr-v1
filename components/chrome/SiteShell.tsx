'use client';

import SmoothScroll from '@/components/providers/SmoothScroll';
import { IntroProvider } from '@/components/providers/Intro';
import Preloader from '@/components/chrome/Preloader';
import Nav from '@/components/chrome/Nav';
import Cursor from '@/components/chrome/Cursor';
import FilmGrain from '@/components/chrome/FilmGrain';

/**
 * Holds the client-only chrome so each route's page can stay a server
 * component.
 *
 * The entry sequence is rendered unconditionally and decides for itself
 * whether to play — see the note in Preloader. Choosing here instead left an
 * orphaned server-rendered overlay on every navigation after the first.
 */
export default function SiteShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  /** Rendered outside `<main>` so the landmark structure stays correct. */
  footer?: React.ReactNode;
}) {
  return (
    <IntroProvider>
      <SmoothScroll>
        <Preloader />
        <Nav />
        <Cursor />
        <FilmGrain />
        <main id="main">{children}</main>
        {footer}
      </SmoothScroll>
    </IntroProvider>
  );
}
