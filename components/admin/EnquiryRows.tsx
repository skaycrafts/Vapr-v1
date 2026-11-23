'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LOCATIONS } from '@/lib/content';
import { cn } from '@/lib/utils';
import type { Enquiry, Status } from '@/lib/enquiry-shape';

/**
 * The list, and the two actions that matter: ring them, and mark it done.
 *
 * Cards rather than a table. A table of eleven columns is the obvious shape
 * for this and the wrong one on the device the desk actually holds — the
 * phone at the counter — where it becomes a horizontal scroll with the
 * telephone number always just off the right edge. Each enquiry is one
 * block: who, which hotel, when, and how to reach them, in that order.
 */

const LABEL: Record<Status, string> = {
  new: 'New',
  contacted: 'Contacted',
  booked: 'Booked',
  closed: 'Closed',
};

const ORDER: Status[] = ['new', 'contacted', 'booked', 'closed'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pretty = (iso: string | null) => {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return y && m && d ? `${d} ${MONTHS[m - 1]}` : iso;
};

/** "2h ago" beats a timestamp when the question is always "how long have they waited". */
function since(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'yesterday' : `${days}d ago`;
}

export default function EnquiryRows({ enquiries }: { enquiries: Enquiry[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  if (enquiries.length === 0) {
    return (
      <p className="rounded-2xl bg-pitch px-5 py-8 text-center text-mist ring-1 ring-hairline">
        No enquiries to show.
      </p>
    );
  }

  const update = async (id: string, status: Status) => {
    setBusy(id);
    await fetch(`/api/admin/enquiries/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    start(() => router.refresh());
  };

  return (
    <ul className="space-y-3">
      {enquiries.map((enquiry) => {
        const hotel = LOCATIONS.find((l) => l.slug === enquiry.location);
        const nights =
          enquiry.checkIn && enquiry.checkOut
            ? Math.round(
                (new Date(enquiry.checkOut).getTime() - new Date(enquiry.checkIn).getTime()) /
                  86_400_000
              )
            : null;

        return (
          <li
            key={enquiry.id}
            className={cn(
              'rounded-2xl p-5 ring-1 transition-opacity',
              enquiry.status === 'new' ? 'bg-pitch ring-hairline-strong' : 'bg-pitch ring-hairline',
              (busy === enquiry.id || pending) && 'opacity-60'
            )}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="text-lg text-ink">{enquiry.name}</p>
              <p className="type-label tabular text-smoke">
                {enquiry.ref} · {since(enquiry.createdAt)}
              </p>
            </div>

            <p className="mt-1 text-sm text-mist">
              {hotel?.shortName ?? enquiry.location}
              {enquiry.checkIn ? (
                <>
                  {' · '}
                  {pretty(enquiry.checkIn)}
                  {enquiry.checkOut ? ` – ${pretty(enquiry.checkOut)}` : ''}
                  {nights ? ` (${nights} night${nights === 1 ? '' : 's'})` : ''}
                </>
              ) : (
                ' · dates not given'
              )}
              {enquiry.guests ? ` · ${enquiry.guests} guest${enquiry.guests === 1 ? '' : 's'}` : ''}
              {enquiry.rooms ? `, ${enquiry.rooms} room${enquiry.rooms === 1 ? '' : 's'}` : ''}
            </p>

            {enquiry.message ? (
              <p className="mt-3 max-w-[70ch] whitespace-pre-wrap border-l-2 border-hairline pl-3 text-sm text-mist">
                {enquiry.message}
              </p>
            ) : null}

            {/* The point of the whole panel: reach them without retyping anything. */}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              {enquiry.phone ? (
                <>
                  <a href={`tel:${enquiry.phone.replace(/[^\d+]/g, '')}`} className="tabular text-ink underline underline-offset-4">
                    {enquiry.phone}
                  </a>
                  <a
                    href={`https://wa.me/${enquiry.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-mist transition-colors hover:text-ink"
                  >
                    WhatsApp ↗
                  </a>
                </>
              ) : null}
              {enquiry.email ? (
                <a href={`mailto:${enquiry.email}`} className="text-ink underline underline-offset-4">
                  {enquiry.email}
                </a>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-hairline pt-4">
              {ORDER.map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={busy === enquiry.id}
                  aria-pressed={enquiry.status === status}
                  onClick={() => update(enquiry.id, status)}
                  className={cn(
                    'rounded-full px-4 py-2 text-xs font-medium transition-colors',
                    enquiry.status === status
                      ? 'bg-ink text-paper'
                      : 'text-mist ring-1 ring-hairline-strong hover:text-ink'
                  )}
                >
                  {LABEL[status]}
                </button>
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
