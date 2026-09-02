'use client';

import { CapabilityProvider } from '@/motion/capability';
import { ScrollProvider } from '@/motion/ScrollProvider';
import { EntryProvider } from '@/motion/entry';
import Overture from '@/motion/Overture';
import Nav from '@/components/chrome/Nav';
import Cursor from '@/components/chrome/Cursor';
import FilmGrain from '@/components/chrome/FilmGrain';

/**
 * Holds the client-only chrome so each route's page can stay a server
 * component.
 *
 * The provider order is the motion architecture, and it is load-bearing:
 *
 *   Capability  — what this device will allow. Everything below reads it, so
 *                 nothing can animate without having asked.
 *   Scroll      — the one Lenis instance and the one GSAP ticker. Needs the
 *                 capability answer before it decides whether to exist at all.
 *   Entry       — the entrance clock, shared by the overture and the hero.
 *
 * The overture is rendered unconditionally and decides for itself whether to
 * play. Choosing here instead left an orphaned server-rendered overlay on
 * every navigation after the first.
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
    <CapabilityProvider>
      <ScrollProvider>
        <EntryProvider>
          <Overture />
          <Nav />
          <Cursor />
          <FilmGrain />
          <main id="main">{children}</main>
          {footer}
        </EntryProvider>
      </ScrollProvider>
    </CapabilityProvider>
  );
}
