'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Emblem from '@/components/brand/Emblem';
import Glass from '@/components/ui/Glass';
import { CTA, NAV, needsVerification } from '@/lib/content';
import { cn } from '@/lib/utils';

/**
 * Deliberately not a full-width bar. The seal anchors the top-left corner and
 * the links ride in a glass pill on the right, so the photography runs edge to
 * edge underneath instead of being cropped by a header.
 *
 * The bar retracts on the way down and returns on the way up — the reading
 * direction gets the full viewport, and the moment you look for navigation it
 * is already there.
 */
export default function Nav() {
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const lastY = useRef(0);
  // Suspends the retract-on-scroll rule: a scroll the navigation started
  // itself should not make the navigation disappear.
  const holding = useRef(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (Math.abs(delta) > 6) {
        lastY.current = y;
        if (holding.current) return;
        setHidden(y > 260 && delta > 0);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (holdTimer.current) clearTimeout(holdTimer.current);
    };
  }, []);

  // The overlay is a modal surface: lock the page and let Escape close it.
  useEffect(() => {
    if (!open) return;
    const lenis = window.__lenis;
    lenis?.stop();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      lenis?.start();
    };
  }, [open]);

  /**
   * Links are real hrefs, so a route change is Next's job. Only a hash that
   * points at the page we are already on is intercepted, and then only to
   * hand it to Lenis for the glide.
   */
  const handle = (href: string) => (event: React.MouseEvent) => {
    const [path, hash] = href.split('#');
    const samePage = (path || '/') === pathname;
    if (!hash || !samePage) {
      setOpen(false);
      return; // let Next navigate
    }

    const target = document.getElementById(hash);
    if (!target) {
      setOpen(false);
      return;
    }

    event.preventDefault();
    setOpen(false);
    setHidden(false);
    holding.current = true;
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      holding.current = false;
    }, 1700);

    // The overlay stops Lenis while it is open, and a stopped instance ignores
    // scrollTo. Restart it here rather than waiting for the close effect.
    const lenis = window.__lenis;
    if (lenis) {
      lenis.start();
      lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    } else {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <a
        href="#main"
        className="sr-only-focusable focus-visible:gutter focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-[var(--z-modal)] focus-visible:m-0 focus-visible:h-auto focus-visible:w-auto focus-visible:overflow-visible focus-visible:whitespace-normal focus-visible:bg-chalk focus-visible:py-3 focus-visible:text-void focus-visible:[clip-path:none]"
      >
        Skip to content
      </a>

      <header
        className={cn(
          'gutter fixed inset-x-0 top-0 z-[var(--z-nav)] flex items-center justify-between py-5 transition-transform duration-500 ease-[var(--ease-out-quart)] md:py-7',
          hidden && !open && '-translate-y-[130%]'
        )}
      >
        <Link href="/" data-cursor="Home" className="group flex items-center gap-3 text-chalk">
          <Emblem
            variant="simple"
            title="VAPR"
            className="w-8 transition-transform duration-[1.6s] ease-[var(--ease-out-quart)] group-hover:rotate-90 md:w-9"
          />
          <span className="type-display text-lg tracking-[0.32em] md:text-xl">VAPR</span>
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <Glass className="flex items-center gap-1 rounded-full px-2 py-2" radius={999}>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={handle(item.href)}
                aria-current={pathname === item.href ? 'page' : undefined}
                className={cn(
                  'rounded-full px-4 py-2 text-sm transition-colors duration-300 hover:text-chalk focus-visible:text-chalk',
                  pathname === item.href ? 'text-chalk' : 'text-mist'
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={CTA.href}
              onClick={handle(CTA.href)}
              className="ml-1 rounded-full bg-chalk px-5 py-2 text-sm font-medium text-void transition-[background-color,transform] duration-300 hover:bg-bone active:scale-[0.97]"
            >
              {CTA.label}
            </Link>
          </Glass>
        </nav>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="menu-overlay"
          className="flex items-center gap-2 text-chalk md:hidden"
        >
          <span className="type-label text-chalk">Menu</span>
          <Menu size={20} strokeWidth={1.25} aria-hidden />
        </button>
      </header>

      {/* Mobile overlay */}
      <div
        id="menu-overlay"
        hidden={!open}
        className="fixed inset-0 z-[var(--z-modal)] bg-void/97 md:hidden"
      >
        <div className="gutter flex h-full flex-col">
          <div className="flex items-center justify-between py-5">
            <span className="type-display text-lg tracking-[0.32em] text-chalk">VAPR</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
              <X size={22} strokeWidth={1.25} className="text-chalk" aria-hidden />
            </button>
          </div>

          <nav aria-label="Primary, mobile" className="flex flex-1 flex-col justify-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={handle(item.href)}
                className="type-display hairline-b py-5 text-4xl text-chalk"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={CTA.href}
              onClick={handle(CTA.href)}
              className="type-display py-5 text-4xl text-chalk"
            >
              {CTA.label}
            </Link>
          </nav>

          <div className="flex items-center justify-between py-8">
            <a href={needsVerification.phoneHref} className="text-sm text-mist">
              {needsVerification.phone}
            </a>
            <Emblem variant="simple" className="w-10 text-ash" />
          </div>
        </div>
      </div>
    </>
  );
}
