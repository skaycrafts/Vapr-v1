import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PropertyHero from '@/components/property/PropertyHero';
import PropertyRoom from '@/components/property/PropertyRoom';
import GettingThere from '@/components/property/GettingThere';
import PropertyGuide from '@/components/property/PropertyGuide';
import Spaces from '@/components/sections/Spaces';
import Reserve from '@/components/sections/Reserve';
import Detail from '@/components/sections/Detail';
import { LOCATIONS, locationBySlug } from '@/lib/content';
import { jsonLd, propertyNodes } from '@/lib/schema';
import { renditionOf, type ImageSlug } from '@/lib/media';

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

  /**
   * Written per property in `content.ts` rather than assembled here. The
   * assembled version — "Guindy — Chennai", and a description built from the
   * blurb and the room list — never contained "hotel", the airport or T.
   * Nagar, which are the words a guest types.
   *
   * `absolute`, because the written titles already carry the brand and the
   * root template would add a second "— VAPR".
   */
  const { title, description } = location.seo;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/${location.slug}` },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `/${location.slug}`,
      // Was a hard-coded `-1600.webp` at 1600×704 for both. Ashok Nagar's
      // exterior is 1278px wide at source, so no 1600 file was ever made and
      // its share card pointed at nothing.
      images: location.heroImage
        ? [{ ...renditionOf(location.heroImage as ImageSlug), alt: location.name }]
        : undefined,
    },
  };
}

export default async function LocationPage({ params }: { params: Promise<Params> }) {
  const { location: slug } = await params;
  const location = locationBySlug(slug);
  if (!location) notFound();

  /**
   * The hotel, its page, its breadcrumb and its questions — linked by `@id`
   * to the brand nodes the site layout emits. The guest rating is shown on
   * the page with its source named, but is deliberately not marked up as
   * `aggregateRating`: those reviews were collected by a booking platform,
   * not by this site.
   */
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(propertyNodes(location)) }}
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
      {/* Keyed to the shared rooms' own flag, not the guest rooms'. A property
          can have photographs of its rooms and none of its stair. */}
      <Spaces
        overrides={location.spaces}
        note={
          location.spacesArePlaceholder
            ? `Some of ${location.shortName}'s shared rooms are still being photographed. Where a frame is missing it is from Ashok Nagar, finished to the same standard.`
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

        Ink, like the homepage's copy of it, so the rooms, this sheet and the
        way there read as one dark run between the building and the enquiry.
      */}
      <Detail tone="ink" />
      <GettingThere location={location} />
      {/* The same facts again, in sentences: what this hotel is for, and the
          questions guests ask before booking. Plain text on purpose — it is
          what search and answer engines quote. */}
      <PropertyGuide location={location} />
      <Reserve defaultSlug={location.slug} />
    </>
  );
}
