'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { STATUSES, type Status } from '@/lib/enquiry-shape';

const LABEL: Record<string, string> = {
  all: 'Everything',
  new: 'New',
  contacted: 'Contacted',
  booked: 'Booked',
  closed: 'Closed',
};

export default function StatusFilter({ current }: { current: Status | 'all' }) {
  const options: (Status | 'all')[] = ['all', ...STATUSES];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Link
          key={option}
          href={option === 'all' ? '/admin/enquiries' : `/admin/enquiries?status=${option}`}
          aria-current={current === option ? 'page' : undefined}
          className={cn(
            'rounded-full px-4 py-2 text-sm transition-colors',
            current === option
              ? 'bg-ink text-paper'
              : 'text-mist ring-1 ring-hairline-strong hover:text-ink'
          )}
        >
          {LABEL[option]}
        </Link>
      ))}
    </div>
  );
}
