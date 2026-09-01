'use client';

import { useState } from 'react';
import SmoothScroll from '@/components/providers/SmoothScroll';
import { IntroProvider } from '@/components/providers/Intro';
import Preloader from '@/components/chrome/Preloader';
import Nav from '@/components/chrome/Nav';
import Cursor from '@/components/chrome/Cursor';
import FilmGrain from '@/components/chrome/FilmGrain';

/**
 * Holds the client-only chrome so the page itself can stay a server
 * component. The entry sequence runs once per browsing session — coming back
 * from a room page should not make anyone watch it again.
 */
export default function SiteShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  /** Rendered outside `<main>` so the landmark structure stays correct. */
  footer?: React.ReactNode;
}) {
  const [seen] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const already = sessionStorage.getItem('vapr:intro') === '1';
      sessionStorage.setItem('vapr:intro', '1');
      return already;
    } catch {
      // Private modes can throw on access; treat it as a first visit.
      return false;
    }
  });

  return (
    <IntroProvider skipped={seen}>
      <SmoothScroll>
        {!seen && <Preloader />}
        <Nav />
        <Cursor />
        <FilmGrain />
        <main id="main">{children}</main>
        {footer}
      </SmoothScroll>
    </IntroProvider>
  );
}
