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
    'VAPR is two small hotels in Chennai — one in Ashok Nagar, one in Guindy. Cold air, a proper desk, breakfast in the morning, and someone at the desk who knows your name.',
  /**
   * The origin every absolute URL is built from — canonical links, share
   * images, structured data, the sitemap and robots.txt.
   *
   * This was `https://vapr.example`, a placeholder that went live: every
   * canonical and every share card pointed at a domain that does not exist.
   * It falls back to the Railway address the site is actually served from,
   * and `NEXT_PUBLIC_SITE_URL` overrides it the day a real domain is pointed
   * at the site — set it there and rebuild, nothing else changes. Read with
   * the literal `process.env.NEXT_PUBLIC_…` spelling for the reason given
   * above `CONTACT`.
   */
  url: (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://vaprrooms.com').replace(/\/+$/, ''),
} as const;

/**
 * What search results and share cards say about the homepage.
 *
 * Separate from `SITE.tagline` and `SITE.description`, which are the brand's
 * voice. A results page is read in a different way from the site: a visitor
 * scanning ten blue links is matching words to what they typed — "hotel",
 * "Guindy", "airport", "T. Nagar" — and the poetic line never contains them.
 * Each property page owns its own place and landmark terms, so the homepage
 * names both areas and leaves "airport" and "metro" to the description.
 */
export const SEO = {
  title: 'VAPR — Hotels in Guindy & Ashok Nagar, Chennai',
  description:
    'Two small hotels in Chennai: VAPR Guindy, 7.8 km from Chennai Airport, and VAPR Ashok Nagar, 850 m from the metro near T. Nagar. Breakfast and Wi-Fi included.',
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
/**
 * Written out one by one, and never through a helper that takes the name as
 * an argument.
 *
 * `NEXT_PUBLIC_*` does not reach the browser by magic: the bundler finds the
 * literal text `process.env.NEXT_PUBLIC_SOMETHING` in the source and replaces
 * it with the value. That is a find-and-replace, not a lookup — so
 * `process.env[key]`, however tidy, is invisible to it and nothing is
 * substituted into the client bundle at all.
 *
 * This file was doing exactly that. On the server `process.env` is the real
 * Node object, so the values were there and the HTML came out with the phone
 * number, the email and the rate in it. In the browser `process.env` is an
 * empty stub, so all four read back null and the same components rendered
 * "Not yet configured" instead. React then found the two trees disagreeing,
 * threw a hydration error, and the entry sequence never finished — the splash
 * sat over the page and the site never became usable.
 *
 * None of which was visible while the variables were unset, because with
 * nothing configured both sides agreed on null. It would have appeared the
 * first time someone filled them in, which is the worst possible moment.
 */
const clean = (raw: string | undefined) => {
  const value = raw?.trim();
  return value ? value : null;
};

const phoneRaw = clean(process.env.NEXT_PUBLIC_VAPR_PHONE);
const whatsappRaw = clean(process.env.NEXT_PUBLIC_VAPR_WHATSAPP);
const emailRaw = clean(process.env.NEXT_PUBLIC_VAPR_EMAIL);
const rateRaw = clean(process.env.NEXT_PUBLIC_VAPR_RATE_FROM);
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
  /**
   * What is in every room here, whatever its occupancy — and, where the
   * property has only one category, that category's own name and bed.
   *
   * `name`, `bed` and `sleeps` are optional because a property with several
   * room types has no single answer to any of the three; it has `roomTypes`
   * instead. `inclusions` is always true of all of them.
   */
  readonly room: {
    readonly name?: string;
    readonly bed?: string;
    readonly sleeps?: string;
    readonly inclusions: readonly string[];
  };
  /**
   * The ways a room here can be taken, where there is more than one. Each is
   * an occupancy rather than a brand name: what a guest is choosing is how
   * many people are staying, which is the question they can actually answer.
   */
  readonly roomTypes?: readonly {
    readonly name: string;
    readonly sleeps: string;
    /** Only where the arrangement is worth stating. Never invented. */
    readonly note?: string;
  }[];
  /** True of every room type here. Shown once, under the list. */
  readonly roomNote?: string;
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
  /**
   * The same, for the shared rooms.
   *
   * It was one flag for both, which stopped working the day a property had
   * its own room photographs but not its own lounge and stair: clearing the
   * flag would have taken the disclosure off the shared rooms as well, and
   * left Ashok Nagar's lift standing in for Guindy's with nothing saying so.
   */
  readonly spacesArePlaceholder?: boolean;
  /**
   * What this property has in place of the shared room with that `id` in
   * SPACES — its own photograph of the same room, or a different room
   * altogether where the buildings differ.
   *
   * Only the ids listed here change; anything absent keeps Ashok Nagar's
   * entry and stays covered by the disclosure. It replaces an image-only
   * override, which could not express "this building has a gym where the
   * other one has a stair worth photographing".
   */
  readonly spaces?: Readonly<
    Record<
      string,
      {
        readonly name?: string;
        readonly line?: string;
        readonly image?: string;
        /** Left out of this property's sequence entirely. */
        readonly omit?: boolean;
      }
    >
  >;
  readonly heroImage: string | null;
  /**
   * The postal locality where it differs from `area` — Guindy's postcode is
   * Ekkatuthangal's. Used in structured data, so the address machines read
   * matches the one on the Treebo listing and the post office's, while the
   * page keeps calling the hotel by the name guests know.
   */
  readonly locality?: string;
  /** The property's own listing on the booking platform its facts came from. */
  readonly listingUrl: string;
  /**
   * The search-facing half of the property.
   *
   * `positioning` is the page's H1: the one line that says what this hotel
   * is for — the airport side or the city side — in the words someone types.
   * `title` and `description` are the result snippet. `intro` is a single
   * self-contained paragraph of facts, written so that it still makes sense
   * when quoted on its own, which is how answer engines use a page.
   */
  readonly seo: {
    readonly positioning: string;
    readonly title: string;
    readonly description: string;
    readonly intro: string;
  };
  /** Shown on the page and marked up from the same list, so the two agree. */
  readonly faqs: readonly { readonly q: string; readonly a: string }[];
};

/**
 * The questions both hotels answer the same way. The wording repeats `STAY`
 * below — change one, change the other.
 */
const sharedFaqs = (name: string) => [
  {
    q: `What are the check-in and check-out times at ${name}?`,
    a: `Check-in is from 1.00 pm and check-out is by 11.00 am. Early check-in depends on what is free that morning — give the desk a day’s notice and they will try.`,
  },
  {
    q: `Is breakfast included at ${name}?`,
    a: 'Yes. Breakfast and Wi-Fi are included with every room — idli, pongal, toast and filter coffee. Lunch and dinner are available on a pre-order basis.',
  },
];

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
  /**
   * No longer rendered anywhere. The specification sheet used to carry a
   * "Not here, at either" pane listing these; it was taken off the page.
   * Kept because it is true and it came off the listings, not because
   * anything reads it — delete it if it is still unused when you next pass
   * through here.
   */
  /*
   * The gym came off this list: Guindy has one, confirmed by the client and
   * photographed. The two that remain are still stated as unavailable on
   * both listings. Nothing renders this — see the note above — but a list
   * that says a hotel has no gym while the page shows its gym is the kind of
   * wrong that outlives the file it is in.
   */
  notAvailable: ['Laundry service', 'Swimming pool'],
  /**
   * Not in `included` — it is neither complimentary nor automatic. It is a
   * kitchen that will cook for you if you ask it in advance, which is a
   * different promise and is written as one.
   */
  meals: 'Lunch and dinner on a pre-order basis.',
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
    /**
     * One line, because this is read on a phone before anything else on the
     * page and nobody came here to read.
     *
     * It was two paragraphs, then two sentences, and is now the one fact a
     * guest can act on: it is quiet, the metro is close, and so is T. Nagar.
     * The building's own approach — set back behind two rain trees, parking
     * under the deck — is in the photographs directly beneath this and on
     * the way-there map further down, which is where someone looking for it
     * is looking.
     */
    note: [
      'A quiet residential street. The metro is 850 metres away; T. Nagar, ten minutes.',
    ],
    /**
     * Three occupancies rather than one category called Maple.
     *
     * The name came off the booking platform and meant nothing to anyone
     * standing in the room. What a guest is deciding is how many people are
     * staying, so that is what the page asks and answers.
     */
    roomTypes: [
      { name: 'Single occupancy', sleeps: 'One guest' },
      { name: 'Double occupancy', sleeps: 'Two guests' },
      {
        name: 'Triple occupancy',
        sleeps: 'Three guests',
        note: 'Two beds, with an additional mattress made up for the third.',
      },
    ],
    roomNote: 'Maximum three guests in a room, whichever type you take.',
    room: {
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
    heroImage: 'ashok-nagar-exterior',
    // The property's own frame carries both the hero and the panel now, so
    // the street view goes back to being one of the gallery images rather
    // than standing in for the building.
    panelImage: 'ashok-nagar-exterior',
    listingUrl: 'https://www.treebo.com/hotels-in-chennai/treebo-premium-vapr-ashok-nagar-ashok-nagar-4050/',
    seo: {
      positioning: 'Hotel in Ashok Nagar, Chennai — near T. Nagar and the metro',
      title: 'Hotel in Ashok Nagar, Chennai — Near Metro & T. Nagar | VAPR',
      description:
        '30 AC rooms on 46th Street, Ashok Nagar — 850 m from the metro, 2.6 km from T. Nagar. Single, double or triple rooms. Breakfast and Wi-Fi included.',
      intro:
        'VAPR Ashok Nagar is a 30-room hotel at 59/31, 46th Street, Sarvamangala Colony, Ashok Nagar, Chennai 600083 — the city-side VAPR. It sits on a quiet residential street 850 metres from Ashok Nagar Metro, 2.6 km from T. Nagar and 3.4 km from Pondy Bazaar, which suits shopping trips, weddings, family visits and hospital stays. Rooms are single, double or triple occupancy, and breakfast and Wi-Fi are included.',
    },
    faqs: [
      {
        q: 'How far is VAPR Ashok Nagar from the metro?',
        a: 'Ashok Nagar Metro station is 850 metres away, about eight minutes on foot.',
      },
      {
        q: 'How far is VAPR Ashok Nagar from T. Nagar and Pondy Bazaar?',
        a: 'T. Nagar is 2.6 km away and Pondy Bazaar 3.4 km. Forum Mall is 2.9 km and SIIMS Hospital 2.6 km.',
      },
      {
        q: 'What rooms does VAPR Ashok Nagar have?',
        a: 'Thirty rooms, taken as single, double or triple occupancy, with a maximum of three guests in a room. Triple rooms have two beds and an additional mattress for the third guest. Every room has air conditioning, a work desk, a wardrobe, a television with DTH and a geyser.',
      },
      ...sharedFaqs('VAPR Ashok Nagar'),
      {
        q: 'Is there parking at VAPR Ashok Nagar?',
        a: 'Yes, outdoor parking on site. The building also has a lift and room service.',
      },
      {
        q: 'How far is VAPR Ashok Nagar from Chennai Airport and Chennai Central?',
        a: 'Chennai Airport is 9 km away and Chennai Central 10 km. For a stay nearer the airport, VAPR Guindy is 7.8 km from it.',
      },
    ],
  },
  {
    slug: 'guindy',
    name: 'VAPR Guindy',
    shortName: 'Guindy',
    /**
     * Guindy, not Ekkatuthangal.
     *
     * Ekkatuthangal is the postal locality for 600032 and it is what the
     * Treebo listing carries. Guindy is the name the hotel goes by and the one
     * a guest navigating Chennai recognises, so it is the name used
     * throughout. The street and the postcode are untouched, and between them
     * they still carry the search — `mapsHref` sends the whole line and 600032
     * is the precise part of it.
     */
    area: 'Guindy',
    street: '4, 4th Cross Street, Kalaimagal Nagar',
    postalCode: '600032',
    rating: { score: 4.0, count: 377 },
    roomCount: 16,
    blurb: 'Sixteen rooms in Guindy, close to the industrial belt.',
    /**
     * Two short lines, for the reason Ashok Nagar's are two short lines.
     *
     * What went was not only length but duplication: the fridge, the locker,
     * the sofa chair and the low table are the room's inclusion list, and the
     * indoor parking and the night security are in the building's — both
     * printed in full a few centimetres to the right. This column is for what
     * the specification cannot say, which is what the place is like.
     */
    note: [
      'The smaller of the two, and the quieter. The rooms here are the larger ones.',
      'Working Chennai: offices, workshops, and places to eat within a few hundred metres.',
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
      'Gym',
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
    // Guindy's own rooms at last, supplied by the client. The first is the
    // panel frame; the four after it are the gallery, which takes
    // `images.slice(1, 5)`. The bathroom and the lounge sit at the end,
    // outside that window, so they are carried but not shown twice.
    images: [
      'guindy-room-king',
      'guindy-room-view',
      'guindy-twin-beds',
      'guindy-room-desk',
      'guindy-bath',
      'guindy-lounge',
      'guindy-dining',
      'guindy-room-wide',
      'guindy-room-twin',
    ],
    /*
     * Four rooms, every one of them this building.
     *
     * Reception and the parking were the last two frames borrowed from Ashok
     * Nagar; rather than show another hotel's desk under this one's name they
     * are left out, and the section is four rooms long here and six at Ashok
     * Nagar. Put them back the moment Guindy's own are photographed — the
     * entries below are all that stand between them and the page.
     */
    spaces: {
      reception: { omit: true },
      parking: { omit: true },
      dining: { image: 'guindy-dining' },
      meeting: { image: 'guindy-meeting' },
      common: { image: 'guindy-lounge' },
      // Where Ashok Nagar shows its stair and lift. Guindy has a lift too —
      // it is in the facilities below — but a gym is the more useful thing
      // to show someone deciding between the two.
      circulation: {
        name: 'Gym',
        line: 'Two treadmills, a cross-trainer and a cycle. Air-conditioned.',
        image: 'guindy-gym',
      },
    },
    // Nothing borrowed is shown any more, so there is nothing to disclose.
    // Guindy's own building at last. `imagesArePlaceholder` still stands and
    // still drives the disclosures — the *rooms* here are Ashok Nagar's — but
    // the exterior is no longer among them, and `facade-canopy` was a
    // photograph of the other hotel standing in for this one with nothing on
    // the page saying so.
    heroImage: 'guindy-exterior',
    panelImage: 'guindy-exterior',
    locality: 'Ekkatuthangal',
    listingUrl: 'https://www.treebo.com/hotels-in-chennai/treebo-vapr-guindy-ekkatuthangal-ekkatuthangal-2559/',
    seo: {
      positioning: 'Hotel in Guindy, near Chennai Airport',
      title: 'Hotel in Guindy near Chennai Airport | VAPR Guindy',
      description:
        '16 AC Deluxe rooms in Guindy, 7.8 km from Chennai Airport. Breakfast and Wi-Fi included, plus a gym, indoor parking and 24-hour security.',
      intro:
        'VAPR Guindy is a 16-room hotel at 4, 4th Cross Street, Kalaimagal Nagar, Ekkatuthangal, Guindy, Chennai 600032 — the airport-side VAPR. Chennai Airport is 7.8 km away, which makes it a practical base for early and late flights and for work in Guindy’s industrial and office belt. Every room is a Deluxe room with a queen or two single beds; breakfast and Wi-Fi are included, and the building has a gym, indoor parking and 24-hour security.',
    },
    faqs: [
      {
        q: 'How far is VAPR Guindy from Chennai Airport?',
        a: 'About 7.8 km. The desk can arrange a cab on request, at a charge.',
      },
      {
        q: 'What rooms does VAPR Guindy have?',
        a: 'Sixteen Deluxe rooms, each with a queen bed or two separate single beds. Every room has air conditioning, a mini fridge, a work desk, a sofa chair and coffee table, a wardrobe with a locker, a television with DTH and a geyser.',
      },
      ...sharedFaqs('VAPR Guindy'),
      {
        q: 'Is there parking at VAPR Guindy?',
        a: 'Yes, indoor parking, with security on the building 24 hours a day.',
      },
      {
        q: 'Does VAPR Guindy have a gym?',
        a: 'Yes. Two treadmills, a cross-trainer and a cycle, in an air-conditioned room.',
      },
      {
        q: 'What is near VAPR Guindy?',
        a: 'Ashok Pillar is 2.1 km away, Guindy Bus Stand 3.1 km, MIOT International 3.3 km, Kauvery Hospital 4.1 km, Guindy Station 5.4 km and Phoenix Marketcity 5.6 km. Chennai Central is 8.6 km.',
      },
    ],
  },
];

export const locationBySlug = (slug: string) => LOCATIONS.find((l) => l.slug === slug);

/**
 * Plain "Chennai" for both, now that each property's area and short name are
 * the same word. The helper appends the area only where it differs, which was
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
 * each property carries its own rooms on its own page, and both properties
 * are already the two entries above. Sending "The rooms" to either one would
 * quietly pick a favourite.
 */
/**
 * The header's only control.
 *
 * There was a NAV list beside it — Ashok Nagar and Guindy — and it has gone
 * with the menu that held it. Neither property is stranded: the homepage
 * opens on two buttons that go straight to them, and the footer lists both
 * with their addresses. What the header does now is the one thing a hotel
 * site's header is for.
 */
export const CTA = { label: 'Book now', href: '/#reserve' } as const;

export const HERO = {
  wordmark: 'VAPR',
  /**
   * Trimmed from "Two addresses in Chennai": the hero now names the city on
   * its own line above the statement, and saying Chennai twice in one frame
   * is not emphasis, it is an edit nobody made.
   */
  place: 'Two addresses',
  statement: 'A quiet floor\nabove a loud street.',
  /**
   * The one word set in the script face, and the only one on the site.
   *
   * It must appear verbatim in `statement`; `Hero` splits the line on it and
   * renders the rest unchanged, so a typo here degrades to a plain headline
   * rather than to a broken one. "quiet" is the word the hotel is actually
   * selling, which is the test for whether an accent has earned the attention
   * it takes.
   */
  accent: 'quiet',
  /**
   * Under the wordmark: where the two of them are, before anything else.
   *
   * This is the homepage's H1 — the statement below is the line people
   * remember, this is the one a search engine reads as the page's subject.
   * It said "Hotels in Guindy and Ashok Nagar" for a while, to get the word
   * "hotel" into the heading. The two place names are the line that was
   * asked for and the line the frame wants; "hotel" is carried by the title,
   * the description and every heading under the fold instead.
   */
  areas: 'Guindy and Ashok Nagar',
  scrollCue: 'Scroll',
} as const;

/** The section directly under the hero. */
export const LOCATIONS_INTRO = {
  eyebrow: 'Two addresses',
  title: 'Two Destinations. One Signature Experience.',
  /**
   * One sentence, and it is a string rather than the two paragraphs it
   * replaced. The break after the dash is deliberate — the two place names
   * are the heading of the thought and the rest is the answer to it — so it
   * is rendered with `whitespace-pre-line`, the same way the hero sets its
   * statement across two lines.
   */
  body: 'Ashok Nagar & Guindy —\nsame comfort, same people, just closer to wherever you’re headed. Guindy is the airport side, 7.8 km from Chennai Airport. Ashok Nagar is the city side, 850 m from the metro and close to T. Nagar.',
} as const;

export const MANIFESTO = {
  body: 'Chennai arrives all at once. Heat off the tar, three horns at every junction, white glare off the hoardings. Both of our doors do the same job: they shut behind you, and the noise stops. Cold air. A desk you can actually work at. Breakfast downstairs from the morning. Everything you need, and not one thing more.',
  attribution: 'Ashok Nagar and Guindy, Chennai',
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
    line: 'Breakfast is included. Idli, pongal, toast, and filter coffee worth getting up for. Lunch and dinner on a pre-order basis.',
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
  title: 'Different stays. The same VAPR feeling.',
  intro:
    'The two properties differ in size and in a few fittings. Everything below is true of both.',
} as const;

export const RESERVE = {
  title: 'Stay',
  body: 'Tell us which one and when. Someone answers.',
  cta: 'Send the enquiry',
  /** Under the enquiry card, above a button to each property's page. */
  explore: 'Before choosing the location, have a look at them and their nearby places',
} as const;

export const FOOTER = {
  note: 'VAPR is two small hotels in Chennai — Ashok Nagar and Guindy. Same beds, same breakfast, twenty minutes apart.',
  legal: [
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Cancellation', href: '/cancellation' },
    // The one in this row that exists today. It is where a reader goes
    // looking for the page they half-remember, and where a crawler finds
    // every page on the site expressed as links rather than as XML.
    { label: 'Sitemap', href: '/sitemap.html' },
  ],
  credit: { prefix: 'Designed and developed by', name: 'SKAY CRAFTS', href: 'https://skaycrafts.com/' },
} as const;

/** Google Maps deep link from the postal address — no invented coordinates. */
export const mapsHref = (l: Location) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${l.name}, ${l.street}, ${l.area}, ${SITE.city} ${l.postalCode}`
  )}`;

/**
 * The Chennai chapter — the one scripted scene on the page.
 *
 * The words are what the stay is, arriving one after another and overlapping
 * — the morning, the light, the time, the stay itself. Then they all go, and
 * what is left is the hotel. The copy below is the same sentence the
 * manifesto has always carried; the chapter just gives it somewhere to land.
 *
 * These were the city instead — heat, traffic, horns, glare, stacked until
 * the screen was as loud as the street. Worth knowing when reading `turn`
 * and `resolution` below, which still answer the louder version.
 */
export const CHENNAI = {
  city: 'Chennai',
  /** Arrive in order, and overlap. Each one is a fragment of the sentence. */
  noise: [
    { word: 'Morning', note: 'without the rush' },
    { word: 'Light', note: 'through the curtains' },
    { word: 'Time', note: 'to slow down' },
    { word: 'A stay', note: 'worth remembering' },
  ],
  /** The turn. One line, held in silence. */
  turn: 'Then a door shuts behind you.',
  resolution: 'And the noise stops.',
  closing:
    'Cold air. A desk you can actually work at. Breakfast downstairs from the morning. Everything you need, and not one thing more.',
  attribution: 'Ashok Nagar and Guindy, Chennai',
} as const;
