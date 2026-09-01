/**
 * Every string on the site lives here.
 *
 * VERIFY BEFORE LAUNCH — the block marked `needsVerification` holds the only
 * facts that were not read off the photography. Rates, the phone number and
 * the inbox are deliberate placeholders; the address and the travel times are
 * best-effort and should be confirmed by the property.
 */

export const SITE = {
  name: 'VAPR',
  legalName: 'VAPR Ashok Nagar',
  locality: 'Ashok Nagar',
  city: 'Chennai',
  region: 'Tamil Nadu',
  country: 'IN',
  postalCode: '600083',
  street: '59/31, 46th Street, Sarvamangala Colony',
  tagline: 'A quiet floor above a loud street.',
  description:
    'A small hotel in Ashok Nagar, Chennai. Cold air, dark stone, a door that closes properly, and the city kept where it belongs.',
  url: 'https://vapr.example',
} as const;

/** Swap these for the real values before the site goes live. */
export const needsVerification = {
  phone: '+91 00000 00000',
  phoneHref: 'tel:+910000000000',
  whatsapp: 'https://wa.me/910000000000',
  email: 'stay@vapr.example',
  ratesFrom: 3200, // per night, INR — placeholder
  currency: 'INR',
  /** Approximate road distances from Ashok Nagar. Confirm before launch. */
  distances: [
    { place: 'Ashok Pillar', km: 0.6 },
    { place: 'T. Nagar', km: 3.2 },
    { place: 'Chennai International Airport', km: 8.4 },
    { place: 'Marina Beach', km: 10.1 },
  ],
  coordinates: { lat: 13.0352, lng: 80.2119 },
} as const;

export const NAV = [
  { label: 'Rooms', href: '#rooms' },
  { label: 'Spaces', href: '#spaces' },
  { label: 'Detail', href: '#detail' },
  { label: 'Finding us', href: '#location' },
] as const;

export const HERO = {
  wordmark: 'VAPR',
  place: 'Ashok Nagar, Chennai',
  statement: 'A quiet floor\nabove a loud street.',
  scrollCue: 'Scroll',
} as const;

/**
 * Read one word at a time as the section scrubs past. Kept near 50 words —
 * long enough to earn the pin, short enough not to strand anyone in it.
 */
export const MANIFESTO = {
  body: 'Chennai arrives all at once. Heat off the tar, three horns at every junction, white glare from the hoardings on 46th Street. VAPR takes all of that and turns it down. Cold air. Dark stone underfoot. A door that shuts properly behind you. Everything you need, and not one thing more.',
  attribution: 'Ashok Nagar, Chennai',
} as const;

export const ARRIVAL = {
  title: 'Off 46th Street',
  body: [
    'The building sits back from the road behind two rain trees, which is the first quiet thing about it. Park under the deck, come up through the gate.',
    'Reception is one desk and one person, and they will already know your name. Check-in takes about ninety seconds.',
  ],
  marks: [
    { at: 18, label: 'Rain trees' },
    { at: 54, label: 'Covered deck' },
    { at: 79, label: 'Four floors' },
  ],
} as const;

export type Room = {
  readonly id: string;
  readonly index: string;
  readonly name: string;
  readonly sleeps: string;
  readonly bed: string;
  readonly note: string;
  readonly images: readonly string[];
  readonly spec: readonly { readonly label: string; readonly value: string }[];
};

export const ROOMS: readonly Room[] = [
  {
    id: 'studio-king',
    index: '01',
    name: 'Studio King',
    sleeps: 'Two guests',
    bed: 'King',
    note: 'The largest of the three. A king bed centred on the timber headboard, a desk that is actually a desk, and a window that takes the morning.',
    images: ['room-a-bed', 'room-a-window', 'room-a-wide', 'room-a-bath'],
    spec: [
      { label: 'Bed', value: 'King' },
      { label: 'Sleeps', value: 'Two' },
      { label: 'Bath', value: 'Walk-in shower' },
      { label: 'Desk', value: 'Full width' },
      { label: 'Outlook', value: 'Street, east' },
    ],
  },
  {
    id: 'corner-twin',
    index: '02',
    name: 'Corner Twin',
    sleeps: 'Two guests',
    bed: 'Two singles',
    note: 'Two beds made up separately, for the colleagues and the siblings. A corner position, so daylight arrives from two directions and corridor noise from none.',
    images: ['room-b-wide', 'room-twin', 'room-b-bed', 'room-b-light'],
    spec: [
      { label: 'Bed', value: 'Two singles' },
      { label: 'Sleeps', value: 'Two' },
      { label: 'Bath', value: 'Walk-in shower' },
      { label: 'Desk', value: 'Yes' },
      { label: 'Outlook', value: 'Two aspects' },
    ],
  },
  {
    id: 'lounge-suite',
    index: '03',
    name: 'Lounge Suite',
    sleeps: 'Two guests, plus one',
    bed: 'King, plus seating',
    note: 'A separate sitting area with leather chairs and a low table, for the stays that run past a week and the calls that run past an hour.',
    images: ['room-lounge', 'room-pillows', 'room-headboard', 'detail-curtain'],
    spec: [
      { label: 'Bed', value: 'King' },
      { label: 'Sleeps', value: 'Two, plus one' },
      { label: 'Sitting', value: 'Two chairs' },
      { label: 'Bath', value: 'Walk-in shower' },
      { label: 'Outlook', value: 'Street' },
    ],
  },
] as const;

export const SPACES = [
  {
    id: 'reception',
    name: 'Reception',
    image: 'reception-desk',
    line: 'One desk, split stone, four pendants. Staffed around the clock.',
  },
  {
    id: 'dining',
    name: 'Dining Room',
    image: 'dining-room',
    line: 'Breakfast from seven. Idli, pongal, toast, and filter coffee worth getting up for.',
  },
  {
    id: 'conference',
    name: 'Conference Room',
    image: 'conference-room',
    line: 'Seats twelve. Projection wall, blackout blinds, a door you can close.',
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
    line: 'Covered, on site, monitored. Pull in off the street.',
  },
] as const;

export const DETAIL = {
  title: 'What is in the room',
  intro: 'Nothing here is a surprise, which is rather the point. This is the whole list.',
  groups: [
    {
      heading: 'In the room',
      items: [
        'Air conditioning, individually controlled',
        'Keycard entry and a night latch',
        'Do-not-disturb from the bedside',
        'Blackout curtains',
        'Work desk and task light',
        'Kettle, tea, and filter coffee',
        'Walk-in shower, hot water at all hours',
        'Flat screen with cable',
        'Daily housekeeping',
      ],
    },
    {
      heading: 'In the building',
      items: [
        'Reception staffed 24 hours',
        'Lift to all four floors',
        'Breakfast service, 7.00 to 10.30',
        'Conference room for twelve',
        'Common room, open all day',
        'Covered parking on site',
        'CCTV throughout the public floors',
        'Laundry on request',
      ],
    },
  ],
} as const;

export const LOCATION = {
  title: 'Finding us',
  body: 'Ashok Nagar is west Chennai going about its ordinary business: the pillar, the market, the metro two streets over. We are on 46th Street, set back behind the trees.',
} as const;

export const RESERVE = {
  title: 'Stay',
  body: 'Write, call, or send a message. Someone answers.',
  cta: 'Check availability',
} as const;

export const FOOTER = {
  note: 'VAPR is a small hotel in Ashok Nagar, Chennai. Four floors, three room types, one desk.',
  legal: [
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Cancellation', href: '/cancellation' },
  ],
} as const;
