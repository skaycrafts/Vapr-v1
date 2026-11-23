'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/enquiries', label: 'Enquiries' },
  { href: '/admin/rates', label: 'Rates & dates' },
];

export default function AdminNav() {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map((link) => {
        // `/admin` would otherwise light up on every page beneath it.
        const active = link.href === '/admin' ? path === '/admin' : path.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-lg px-3 py-2.5 text-sm transition-colors',
              active ? 'bg-ink font-medium text-paper' : 'text-mist hover:bg-glass hover:text-ink'
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
