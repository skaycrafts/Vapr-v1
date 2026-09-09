import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PropertyHero from '@/components/property/PropertyHero';
import PropertyRoom from '@/components/property/PropertyRoom';
import GettingThere from '@/components/property/GettingThere';
import Spaces from '@/components/sections/Spaces';
import Reserve from '@/components/sections/Reserve';
import Detail from '@/components/sections/Detail';
import { LOCATIONS, SITE, STAY, locationBySlug, placeOf } from '@/lib/content';

type Params = { location: string };

export function generateStaticParams() {
  return LOCATIONS.map((l) => ({ location: l.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { location: slug } = await params;
  const location = locationBySlug(slug);
  if (!location) return {};

  const title = `${location.shortName} — ${placeOf(location)}`;
  const description = `${location.blurb} ${location.room.name} rooms with ${location.room.bed.toLowerCase()}. Breakfast and Wi-Fi included.`;

  return {
    title,
    description,
    alternates: { canonical: `/${location.slug}` },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `/${location.slug}`,
      images: location.heroImage
        ? [{ url: `/media/img/${location.heroImage}-1600.webp`, width: 1600, height: 704 }]
        : undefined,
    },
  };
}

export default async function LocationPage({ params }: { params: Promise<Params> }) {
  const { location: slug } = await params;
  const location = locationBySlug(slug);
  if (!location) notFound();

  /**
   * Per-property Hotel schema. The guest rating is shown on the page with its
   * source named, but is deliberately not marked up as `aggregateRating` —
   * those reviews were collected by a booking platform, not by this site.
   */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: location.name,
    description: location.blurb,
    url: `${SITE.url}/${location.slug}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: location.street,
      addressLocality: `${location.area}, ${SITE.city}`,
      addressRegion: SITE.region,
      postalCode: location.postalCode,
      addressCountry: SITE.country,
    },
    numberOfRooms: location.roomCount,
    checkinTime: '13:00',
    checkoutTime: '11:00',
    amenityFeature: [...location.facilities, ...STAY.included.map((i) => i.split(' — ')[0])].map(
      (name) => ({ '@type': 'LocationFeatureSpecification', name, value: true })
    ),
    parentOrganization: { '@type': 'Organization', name: SITE.legalName, url: SITE.url },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/*
        The property, end to end: the building, its one room, the rooms
        everybody shares, how to get there, and the enquiry.

        The room and the shared spaces used to be generic homepage sections —
        "The rooms" and "The rest of it" — which meant a visitor met Maple and
        the Meeting Room before the page had established which of the two
        hotels either belonged to. They live here now, where the answer to
        "which building is this?" is already on the screen.
      */}
      <PropertyHero location={location} />
      <PropertyRoom location={location} />
      <Spaces
        note={
          location.imagesArePlaceholder
            ? `${location.shortName}'s shared rooms are still being photographed. The frames here are from Ashok Nagar, finished to the same standard.`
            : undefined
        }
      />
      {/*
        "What you get, either way" — the same sheet the homepage carries, and
        deliberately the same one rather than a per-property cut of it. Its
        first pane is what both hotels include, and the two after it are each
        property's own fittings; showing only this property's column would
        leave a guest who is choosing between the two unable to see what they
        would be choosing against, which is the question this page exists to
        settle. The title says "either way" and means it.
      */}
      <Detail />
      <GettingThere location={location} />
      <Reserve defaultSlug={location.slug} />
    </>
  );
}
