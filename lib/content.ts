/**
 * Every string on the site lives here.
 *
 * Property facts — room categories, inclusions, facilities, ratings, check-in
 * times and landmark distances — are taken from each hotel's own Treebo
 * listing. Where a fact is not on the listing it is not asserted here; the
 * handful of values still to be confirmed sit in `needsVerification` and
 * nowhere else.
 *
 *   Ashok Nagar  treebo.com/hotels-in-chennai/treebo-premium-vapr-ashok-nagar-ashok-nagar-4050/
 *   Guindy       treebo.com/hotels-in-chennai/treebo-vapr-guindy-ekkatuthangal-ekkatuthangal-2559/
 */

export const SITE = {
  name: 'VAPR',
  legalName: 'VAPR Hotels',
  city: 'Chennai',
  region: 'Tamil Nadu',
  country: 'IN',
  tagline: 'Two small hotels in Chennai.',
  description:
    'VAPR is two small hotels in Chennai — one in Ashok Nagar, one in Ekkatuthangal, near Guindy. Cold air, a proper desk, breakfast in the morning, and someone at the desk who knows your name.',
  url: 'https://vapr.example',
} as const;

/**
 * The details that are not on either Treebo listing, and therefore are not
 * known to this repository.
 *
 * These used to be hard-coded stand-ins — `+91 00000 00000`, a `wa.me` link
 * to a number of zeroes, `stay@vapr.example`, and a nightly rate of 3,200.
 * Shipping those is worse than shipping nothing: a rate invented by a website
 * is a price someone will arrive expecting, and `wa.me/910000000000` is a
 * live URL that resolves to somebody, just not to this hotel.
 *
 * So they come from the environment, and when the environment is silent the
 * site says so rather than making something up. Set any of these to turn the
 * matching channel on:
 *
 *   NEXT_PUBLIC_VAPR_PHONE      +91 44 1234 5678
 *   NEXT_PUBLIC_VAPR_WHATSAPP   919876543210        (digits only, with country code)
 *   NEXT_PUBLIC_VAPR_EMAIL      stay@vapr.co.in
 *   NEXT_PUBLIC_VAPR_RATE_FROM  3200                (INR per night)
 *
 * Everything degrades: with no WhatsApp the enquiry goes by email, with
 * neither it is composed for the guest to copy, and the form never stops
 * working.
 */
const env = (key: string) => {
  const raw = process.env[key];
  const value = raw?.trim();
  return value ? value : null;
};

const phoneRaw = env('NEXT_PUBLIC_VAPR_PHONE');
const whatsappRaw = env('NEXT_PUBLIC_VAPR_WHATSAPP');
const emailRaw = env('NEXT_PUBLIC_VAPR_EMAIL');
const rateRaw = env('NEXT_PUBLIC_VAPR_RATE_FROM');
const rateFrom = rateRaw && Number.isFinite(Number(rateRaw)) ? Number(rateRaw) : null;

export const CONTACT = {
  /** Display string, or null when nobody has configured one. */
  phone: phoneRaw,
  /** `tel:` href, digits only. Null whenever `phone` is. */
  phoneHref: phoneRaw ? `tel:${phoneRaw.replace(/[^\d+]/g, '')}` : null,
  /** wa.me base, or null. The enquiry text is appended at the call site. */
  whatsapp: whatsappRaw ? `https://wa.me/${whatsappRaw.replace(/\D/g, '')}` : null,
  email: emailRaw,
  /** Per night, in INR. Null means the site shows no price at all. */
  ratesFrom: rateFrom,
  currency: 'INR',
  /** What to render where a channel is missing. Never a plausible-looking value. */
  unset: 'Not yet configured',
} as const;

export type Landmark = { readonly place: string; readonly km: number };

export type Location = {
  readonly slug: string;
  /** Full name, as the property is listed. */
  readonly name: string;
  /** How it is referred to in running copy and on buttons. */
  readonly shortName: string;
  readonly area: string;
  readonly street: string;
  readonly postalCode: string;
  readonly rating: { readonly score: number; readonly count: number };
  readonly roomCount: number;
  readonly blurb: string;
  /** One paragraph of voice, written for this property. */
  readonly note: readonly string[];
  readonly room: {
    readonly name: string;
    readonly bed: string;
    readonly sleeps: string;
    readonly inclusions: readonly string[];
  };
  readonly facilities: readonly string[];
  readonly landmarks: readonly Landmark[];
  /** Slugs from the media manifest. Empty where the shoot has not happened. */
  readonly images: readonly string[];
  /**
   * The frame this property shows when the two are set side by side on the
   * home page. Deliberately not `heroImage`: Ashok Nagar's hero *is* the
   * site's own opening photograph, and showing it again a screen and a half
   * later made the second appearance read as a placeholder rather than as a
   * choice. Falls back to `heroImage` where a property has only the one.
   */
  readonly panelImage?: string;
  /**
   * True when `images` are borrowed from another property. The page says so
   * rather than implying the pictures show this building.
   */
  readonly imagesArePlaceholder?: boolean;
  readonly heroImage: string | null;
};

/** Both properties keep the same desk hours. */
export const STAY = {
  checkIn: '1.00 pm',
  checkOut: '11.00 am',
  /** Complimentary at both, per the listings. */
  included: [
    'Wi-Fi',
    'Breakfast',
    'Branded toiletries — shampoo, comb, dental kit, shaving kit, moisturiser, handwash, loofah, shower cap',
  ],
  /** Stated as unavailable at both. Saying so is more useful than silence. */
  notAvailable: ['Laundry service', 'Swimming pool', 'Gym'],
  earlyCheckIn:
    'Early check-in depends on what is free that morning. Give the desk a day’s notice and they will try.',
} as const;

export const LOCATIONS: readonly Location[] = [
  {
    slug: 'ashok-nagar',
    name: 'VAPR Ashok Nagar',
    shortName: 'Ashok Nagar',
    area: 'Ashok Nagar',
    street: '59/31, 46th Street, Sarvamangala Colony',
    postalCode: '600083',
    rating: { score: 4.1, count: 168 },
    roomCount: 30,
    blurb: 'Thirty rooms on a residential street, eight minutes’ walk from the metro.',
    note: [
      'The building sits back from 46th Street behind two rain trees, which is the first quiet thing about it. Park under the deck and come up through the gate.',
      'It is a residential street, so the mornings are quiet and the evenings are children and scooters. The metro is 850 metres away, which means you can leave the car and still be in T. Nagar in ten minutes.',
    ],
    room: {
      name: 'Maple',
      bed: 'Queen, or twin beds that join',
      sleeps: 'Two',
      inclusions: [
        'Air conditioning',
        'Work desk and chair',
        'Wardrobe',
        'Television with DTH',
        'Geyser',
        'Intercom',
      ],
    },
    facilities: [
      'Outdoor parking',
      'Lift',
      'Room service',
      'Air-conditioned lobby',
    ],
    landmarks: [
      { place: 'Ashok Nagar Metro', km: 0.85 },
      { place: 'Valadapani Murugan Temple', km: 2.3 },
      { place: 'T. Nagar', km: 2.6 },
      { place: 'SIIMS Hospital', km: 2.6 },
      { place: 'Forum Mall', km: 2.9 },
      { place: 'Pondy Bazaar', km: 3.4 },
      { place: 'Olympia Tech Park', km: 4.3 },
      { place: 'Chennai Airport', km: 9 },
      { place: 'Chennai Central', km: 10 },
    ],
    images: [
      'room-a-bed',
      'room-a-window',
      'room-a-wide',
      'room-twin',
      'room-b-wide',
      'room-a-bath',
    ],
    heroImage: 'facade-dusk',
    // The hero photograph is this building; the panel shows it from the
    // street instead, so the two are not the same frame twice.
    panelImage: 'facade-street',
  },
  {
    slug: 'guindy',
    name: 'VAPR Guindy',
    shortName: 'Guindy',
    area: 'Ekkatuthangal',
    street: '4, 4th Cross Street, Kalaimagal Nagar',
    postalCode: '600032',
    rating: { score: 4.0, count: 377 },
    roomCount: 16,
    blurb: 'Sixteen rooms in Ekkatuthangal, close to the Guindy industrial belt.',
    note: [
      'Sixteen rooms, which makes it the smaller and the quieter of the two. Ekkatuthangal is working Chennai — offices, workshops, a good many places to eat within a few hundred metres.',
      'The rooms here are the larger ones: a fridge, a locker, a sofa chair and a low table, and room for a third person if you need it. Parking is indoors, and there is someone on security through the night.',
    ],
    room: {
      name: 'Deluxe',
      bed: 'Queen, or two separate single beds',
      sleeps: 'Three, plus one',
      inclusions: [
        'Air conditioning',
        'Mini fridge',
        'Work desk and chair',
        'Sofa chair and coffee table',
        'Wardrobe, locker and luggage shelf',
        'Television with DTH',
        'Geyser',
        'Intercom',
        'Smoke alarm',
      ],
    },
    facilities: [
      'Indoor parking',
      'Lift',
      'Pantry',
      'Ironing boards',
      '24-hour security',
      'Air-conditioned lobby',
      'Cab on request, charged',
    ],
    landmarks: [
      { place: 'Ashok Pillar', km: 2.1 },
      { place: 'Amma Park', km: 2.8 },
      { place: 'Guindy Bus Stand', km: 3.1 },
      { place: 'MIOT International', km: 3.3 },
      { place: 'Forum Mall', km: 4.2 },
      { place: 'Kauvery Hospital', km: 4.1 },
      { place: 'Guindy Station', km: 5.4 },
      { place: 'Phoenix Marketcity', km: 5.6 },
      { place: 'Chennai Airport', km: 7.8 },
      { place: 'Chennai Central', km: 8.6 },
    ],
    // PLACEHOLDER: these are Ashok Nagar's photographs, standing in until
    // Guindy is shot. They are not this building. Swap them the moment real
    // frames exist — `imagesArePlaceholder` drives the on-page disclosure, so
    // clear that flag at the same time.
    images: [
      'room-b-wide',
      'room-b-bed',
      'room-headboard',
      'room-pillows',
      'room-b-light',
      'detail-curtain',
    ],
    imagesArePlaceholder: true,
    heroImage: 'facade-canopy',
  },
];

export const locationBySlug = (slug: string) => LOCATIONS.find((l) => l.slug === slug);

/**
 * "Ekkatuthangal, Chennai" for Guindy; plain "Chennai" for Ashok Nagar, whose
 * neighbourhood and short name are the same word.
 */
export const placeOf = (l: Location) =>
  l.area === l.shortName ? SITE.city : `${l.area}, ${SITE.city}`;

/**
 * "The rooms" used to sit here, pointing at `/#rooms` on the homepage. That
 * section moved into the two property pages, so the anchor stopped resolving
 * and the link became a no-op that reloaded the homepage and scrolled
 * nowhere.
 *
 * It is not repointed because there is no longer one destination to point at:
 * Maple is Ashok Nagar's room and Deluxe is Guindy's, and both properties are
 * already the two entries above. Sending "The rooms" to either one would
 * quietly pick a favourite.
 */
export const NAV = [
  { label: 'Ashok Nagar', href: '/ashok-nagar' },
  { label: 'Guindy', href: '/guindy' },
] as const;

/** The one call to action; kept out of NAV so it is not repeated as a link. */
export const CTA = { label: 'Enquire', href: '/#reserve' } as const;

export const HERO = {
  wordmark: 'VAPR',
  /**
   * Trimmed from "Two addresses in Chennai": the hero now names the city on
   * its own line above the statement, and saying Chennai twice in one frame
   * is not emphasis, it is an edit nobody made.
   */
  place: 'Two addresses',
  statement: 'A quiet floor\nabove a loud street.',
  scrollCue: 'Scroll',
} as const;

/** The section directly under the hero. */
export const LOCATIONS_INTRO = {
  eyebrow: 'Two addresses',
  title: 'There are two of us.',
  body: [
    'VAPR is two small hotels in Chennai. One on a residential street in Ashok Nagar, one in Ekkatuthangal a few minutes from the Guindy junction. They are about twenty minutes apart on a good day.',
    'Same beds, same breakfast, same person at the desk who will have your name ready before you have found your ID. Pick whichever one is closer to wherever you have to be in the morning — and if you are not sure, write to us and we will tell you honestly which one suits.',
  ],
  prompt: 'Have a look at either:',
} as const;

export const MANIFESTO = {
  body: 'Chennai arrives all at once. Heat off the tar, three horns at every junction, white glare off the hoardings. Both of our doors do the same job: they shut behind you, and the noise stops. Cold air. A desk you can actually work at. Breakfast downstairs from the morning. Everything you need, and not one thing more.',
  attribution: 'Ashok Nagar and Ekkatuthangal, Chennai',
} as const;

/** Shown on the home page. Photographed at Ashok Nagar. */
export const SPACES = [
  {
    id: 'reception',
    name: 'Reception',
    image: 'reception-desk',
    line: 'One desk, split stone, four pendants. Someone is on it when you arrive.',
  },
  {
    id: 'dining',
    name: 'Dining Room',
    image: 'dining-room',
    line: 'Breakfast is included. Idli, pongal, toast, and filter coffee worth getting up for.',
  },
  {
    id: 'meeting',
    name: 'Meeting Room',
    image: 'conference-room',
    line: 'A long table, a screen, and a door you can close.',
  },
  {
    id: 'common',
    name: 'Common Room',
    image: 'common-area',
    line: 'The upper floor lounge. Long table, board games, nobody hurrying you.',
  },
  {
    id: 'circulation',
    name: 'Stair and Lift',
    image: 'lift-stone',
    line: 'Granite and brushed steel, and a stair worth using for four floors.',
  },
  {
    id: 'parking',
    name: 'Parking',
    image: 'parking-bay',
    line: 'On site at both — outdoors in Ashok Nagar, under cover in Guindy.',
  },
] as const;

export const DETAIL = {
  title: 'What you get, either way',
  intro:
    'The two properties differ in size and in a few fittings. Everything below is true of both.',
} as const;

export const RESERVE = {
  title: 'Stay',
  body: 'Tell us which one and when. Someone answers.',
  cta: 'Send the enquiry',
} as const;

export const FOOTER = {
  note: 'VAPR is two small hotels in Chennai — Ashok Nagar and Ekkatuthangal. Same beds, same breakfast, twenty minutes apart.',
  legal: [
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Cancellation', href: '/cancellation' },
  ],
} as const;

/** Google Maps deep link from the postal address — no invented coordinates. */
export const mapsHref = (l: Location) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${l.name}, ${l.street}, ${l.area}, ${SITE.city} ${l.postalCode}`
  )}`;

/**
 * The Chennai chapter — the one scripted scene on the page.
 *
 * The words are the city as it arrives: heat, traffic, horns, glare, stacked
 * on top of each other until the screen is as loud as the street. Then they
 * all go, and what is left is the hotel. The copy below is the same sentence
 * the manifesto has always carried; the chapter just gives it somewhere to
 * land.
 */
export const CHENNAI = {
  city: 'Chennai',
  /** Arrive in order, and overlap. Each one is a fragment of the sentence. */
  noise: [
    { word: 'Heat', note: 'off the tar' },
    { word: 'Traffic', note: 'at every junction' },
    { word: 'Horns', note: 'three of them' },
    { word: 'Glare', note: 'white, off the hoardings' },
  ],
  /** The turn. One line, held in silence. */
  turn: 'Then a door shuts behind you.',
  resolution: 'And the noise stops.',
  closing:
    'Cold air. A desk you can actually work at. Breakfast downstairs from the morning. Everything you need, and not one thing more.',
  attribution: 'Ashok Nagar and Ekkatuthangal, Chennai',
} as const;
