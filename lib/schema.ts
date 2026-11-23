import { CONTACT, LOCATIONS, SITE, STAY, mapsHref, type Location } from '@/lib/content';
import { renditionOf, type ImageSlug } from '@/lib/media';

/**
 * Structured data for the whole site, as one linked graph.
 *
 * Every entity has a stable `@id`, and every reference to it is that `@id`.
 * This replaces two unlinked blocks — the brand's Organization listing both
 * hotels inline, and each property page describing its hotel again — which a
 * parser read as four hotels, two of them missing half their facts.
 *
 * Only what this repository knows is asserted. Coordinates, a telephone
 * number and a price are left out until they are configured, and the guest
 * rating is still not marked up: it was collected by Treebo, not by this
 * site, and self-served review markup on a hotel is ineligible anyway.
 */

export const ids = {
  org: `${SITE.url}/#organization`,
  site: `${SITE.url}/#website`,
  hotel: (l: Location) => `${SITE.url}/${l.slug}#hotel`,
  page: (l: Location) => `${SITE.url}/${l.slug}#webpage`,
  breadcrumb: (l: Location) => `${SITE.url}/${l.slug}#breadcrumb`,
  faq: (l: Location) => `${SITE.url}/${l.slug}#faq`,
};

const absolute = (path: string) => new URL(path, SITE.url).href;

const feature = (name: string) => ({
  '@type': 'LocationFeatureSpecification',
  name,
  value: true,
});

/** Brand nodes, emitted on every public page. */
export const siteNodes = () => [
  {
    '@type': 'WebSite',
    '@id': ids.site,
    url: SITE.url,
    name: SITE.name,
    description: SITE.description,
    inLanguage: 'en-IN',
    publisher: { '@id': ids.org },
  },
  {
    '@type': 'Organization',
    '@id': ids.org,
    name: SITE.legalName,
    alternateName: SITE.name,
    url: SITE.url,
    description: SITE.description,
    logo: {
      '@type': 'ImageObject',
      url: absolute('/brand/vapr-emblem-512.png'),
      width: 512,
      height: 512,
    },
    areaServed: { '@type': 'City', name: SITE.city },
    subOrganization: LOCATIONS.map((l) => ({ '@id': ids.hotel(l) })),
    ...(CONTACT.phone ? { telephone: CONTACT.phone } : {}),
    ...(CONTACT.email ? { email: CONTACT.email } : {}),
  },
];

/** The rooms, as the page describes them. Occupancy only where it is stated. */
const rooms = (l: Location) => {
  const url = `${SITE.url}/${l.slug}`;
  const amenities = l.room.inclusions.map(feature);
  if (l.roomTypes?.length) {
    return l.roomTypes.map((t, i) => ({
      '@type': 'HotelRoom',
      '@id': `${url}#room-${i + 1}`,
      name: t.name,
      description: t.note ? `${t.sleeps}. ${t.note}` : t.sleeps,
      occupancy: { '@type': 'QuantitativeValue', maxValue: i + 1, unitText: 'guests' },
      amenityFeature: amenities,
    }));
  }
  return [
    {
      '@type': 'HotelRoom',
      '@id': `${url}#room-1`,
      name: l.room.name ? `${l.room.name} room` : 'Room',
      ...(l.room.bed ? { bed: l.room.bed } : {}),
      amenityFeature: amenities,
    },
  ];
};

export const hotelNode = (l: Location) => {
  const url = `${SITE.url}/${l.slug}`;
  const hero = l.heroImage ? renditionOf(l.heroImage as ImageSlug) : null;
  return {
    '@type': 'Hotel',
    '@id': ids.hotel(l),
    name: l.name,
    description: l.seo.intro,
    url,
    mainEntityOfPage: { '@id': ids.page(l) },
    // The exterior only. Room frames are left out so a frame borrowed from
    // the other building can never be published as this one.
    ...(hero ? { image: [absolute(hero.url)] } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: [l.street, l.locality, l.area].filter(Boolean).join(', '),
      addressLocality: SITE.city,
      addressRegion: SITE.region,
      postalCode: l.postalCode,
      addressCountry: SITE.country,
    },
    hasMap: mapsHref(l),
    containedInPlace: { '@type': 'City', name: SITE.city },
    numberOfRooms: l.roomCount,
    checkinTime: '13:00',
    checkoutTime: '11:00',
    amenityFeature: [
      feature('Free Wi-Fi'),
      feature('Free breakfast'),
      ...STAY.included.slice(2).map((i) => feature(i.split(' — ')[0])),
      // "Cab on request, charged" is a service at a price, not a free amenity.
      ...l.facilities.filter((f) => !/charged/i.test(f)).map(feature),
    ],
    containsPlace: rooms(l),
    sameAs: [l.listingUrl],
    ...(CONTACT.phone ? { telephone: CONTACT.phone } : {}),
    ...(CONTACT.email ? { email: CONTACT.email } : {}),
    ...(CONTACT.ratesFrom ? { priceRange: `From ₹${CONTACT.ratesFrom} per night` } : {}),
    parentOrganization: { '@id': ids.org },
  };
};

/** Everything a property page adds to the brand nodes. */
export const propertyNodes = (l: Location) => [
  hotelNode(l),
  {
    '@type': 'WebPage',
    '@id': ids.page(l),
    url: `${SITE.url}/${l.slug}`,
    name: l.seo.title,
    description: l.seo.description,
    isPartOf: { '@id': ids.site },
    about: { '@id': ids.hotel(l) },
    breadcrumb: { '@id': ids.breadcrumb(l) },
    inLanguage: 'en-IN',
  },
  {
    '@type': 'BreadcrumbList',
    '@id': ids.breadcrumb(l),
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE.name, item: SITE.url },
      { '@type': 'ListItem', position: 2, name: l.name, item: `${SITE.url}/${l.slug}` },
    ],
  },
  {
    '@type': 'FAQPage',
    '@id': ids.faq(l),
    isPartOf: { '@id': ids.page(l) },
    mainEntity: l.faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  },
];

/**
 * Serialised for a `<script type="application/ld+json">`. `<` is escaped so
 * no string in the data can close the script element early.
 */
export const jsonLd = (nodes: object[]) =>
  JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }).replace(/</g, '\\u003c');
