import { listEnquiries, STATUSES, type Status } from '@/lib/server/enquiries';
import EnquiryRows from '@/components/admin/EnquiryRows';
import StatusFilter from '@/components/admin/StatusFilter';

export const dynamic = 'force-dynamic';

export default async function Enquiries({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: asked } = await searchParams;
  const status = (STATUSES as readonly string[]).includes(asked ?? '')
    ? (asked as Status)
    : 'all';
  const enquiries = await listEnquiries({ status });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="type-display text-[clamp(2rem,4vw,3rem)] text-ink">Enquiries</h1>
        <p className="mt-2 text-mist">
          {enquiries.length === 0
            ? 'Nothing here yet.'
            : `${enquiries.length} shown, newest first.`}
        </p>
      </header>

      <StatusFilter current={status} />
      <EnquiryRows enquiries={enquiries} />
    </div>
  );
}
