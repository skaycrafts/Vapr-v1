import { LOCATIONS } from '@/lib/content';
import { getClosures, getRates } from '@/lib/server/rates';
import RatesEditor from '@/components/admin/RatesEditor';

export const dynamic = 'force-dynamic';

export default async function Rates() {
  const [rates, closures] = await Promise.all([getRates(), getClosures()]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="type-display text-[clamp(2rem,4vw,3rem)] text-ink">Rates &amp; dates</h1>
        <p className="mt-2 max-w-[60ch] text-mist">
          The nightly figure the website shows as &ldquo;from&rdquo;, and the dates a property is not
          taking arrivals. Leave a rate empty and the site says <i>On enquiry</i>, as it does today.
        </p>
      </header>

      <RatesEditor
        locations={LOCATIONS.map((l) => ({ slug: l.slug, name: l.shortName }))}
        rates={rates}
        closures={closures}
      />
    </div>
  );
}
