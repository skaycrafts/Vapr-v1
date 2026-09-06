// Curated asset map. slug -> { src, alt, crop? }
//
// `crop` is in fractions of the source frame and is applied before the grade.
// Several exterior and reception frames carry the operating franchise's
// signage, which has no place on a VAPR-branded site; those are cropped so the
// architecture is what is shown.
export const IMAGES = [
  // ── Arrival / exterior ────────────────────────────────────────────
  { slug: 'facade-dusk',      src: 'fascade/JWS03382-HDR.jpg',   alt: 'The facade at dusk, seen up through the rain trees', crop: { height: 0.66 } },
  { slug: 'facade-canopy',    src: 'fascade/JWS03212-HDR.jpg',   alt: 'Rain trees arching over the building front on 46th Street', crop: { height: 0.68 } },
  { slug: 'facade-street',    src: 'fascade/JWS03177-HDR.jpg',   alt: 'The building seen from the street corner, Ashok Nagar', crop: { height: 0.70 } },
  { slug: 'facade-side',      src: 'fascade/JWS03402-HDR.jpg',   alt: 'Side elevation under the tree canopy', crop: { height: 0.70 } },

  // Supplied separately from the shoot, and the only frames of each building
  // taken from above. Uncropped: the franchise signage on the Ashok Nagar
  // elevation is left in place at the client's instruction, against the note
  // at the top of this file.
  { slug: 'ashok-nagar-exterior', src: 'fascade/ashok-nagar-exterior.png', alt: 'The Ashok Nagar building at dusk, lit, seen from above the street corner' },
  { slug: 'guindy-exterior',      src: 'fascade/guindy-exterior.png',      alt: 'The Ekkatuthangal building at dusk, its rooms lit behind full-height glass' },
  { slug: 'sky-cutout',       src: 'june/CAT09525.jpg',          alt: 'Monsoon cloud seen through the roof terrace cutout' },
  { slug: 'parking-bay',      src: 'parking/JWS03714-HDR.jpg',   alt: 'Covered parking bay beneath the building' },

  // ── Thresholds / circulation ──────────────────────────────────────
  { slug: 'lift-stone',       src: 'corridor/JWS03659.jpg',      alt: 'Brushed steel lift doors set into dark granite' },
  { slug: 'lift-wide',        src: 'corridor/JWS03649.jpg',      alt: 'The lift lobby with a doorway opening onto daylight' },
  { slug: 'stair-flight',     src: 'corridor/JWS03689.jpg',      alt: 'The stair flight turning against a white wall' },
  { slug: 'stair-palm',       src: 'corridor/JWS03669.jpg',      alt: 'A palm at the foot of the stairs beside an open room door' },
  { slug: 'corridor-door',    src: 'corridor/JWS03694.jpg',      alt: 'Guest room doorway along the corridor' },

  // ── Rooms ─────────────────────────────────────────────────────────
  { slug: 'room-a-bed',       src: 'r1/JWS03062-HDR.jpg',        alt: 'King bed centred beneath the headboard wall in a Studio King' },
  { slug: 'room-a-wide',      src: 'r1/JWS03082-HDR.jpg',        alt: 'Studio King seen toward the door, desk and chair at the window' },
  { slug: 'room-a-window',    src: 'r1/JWS03057-HDR.jpg',        alt: 'Morning light through the window of a Studio King' },
  { slug: 'room-a-bath',      src: 'r1/JWS03134.jpg',            alt: 'Bathroom with tiled dado and walk-in shower' },
  { slug: 'room-b-bed',       src: 'r2/JWS03497-HDR.jpg',        alt: 'Bed and headboard in a Corner Twin' },
  { slug: 'room-b-wide',      src: 'r2/JWS03507-HDR.jpg',        alt: 'Corner Twin seen from the entry' },
  { slug: 'room-b-light',     src: 'r2/JWS03527-HDR.jpg',        alt: 'Daylight across the floor of a Corner Twin' },
  { slug: 'room-twin',        src: 'june/CAT09421.jpg',          alt: 'Two single beds made up under the artwork wall' },
  { slug: 'room-pillows',     src: 'june/CAT09456.jpg',          alt: 'Pillows and turned linen against the timber headboard' },
  { slug: 'room-headboard',   src: 'june/CAT09458.jpg',          alt: 'Concealed light washing the headboard' },
  { slug: 'room-lounge',      src: 'june/CAT09379.jpg',          alt: 'Leather seating and a low table in the lounge suite' },

  // ── Details ───────────────────────────────────────────────────────
  { slug: 'detail-number',    src: 'june/CAT09499.jpg',          alt: 'Room 306 in brass numerals on a dark door' },
  { slug: 'detail-switch',    src: 'june/CAT09495.jpg',          alt: 'The do-not-disturb switch plate beside the bed' },
  { slug: 'detail-latch',     src: 'june/CAT09501.jpg',          alt: 'Brass door chain resting against the frame' },
  { slug: 'detail-lock',      src: 'june/CAT09528.jpg',          alt: 'Keycard lock set into the timber door' },
  { slug: 'detail-books',     src: 'june/CAT09443.jpg',          alt: 'Two paperbacks left on the bedside table' },
  { slug: 'detail-curtain',   src: 'june/CAT09424.jpg',          alt: 'Curtains parted on the afternoon' },

  // ── Public rooms ──────────────────────────────────────────────────
  { slug: 'reception-desk',   src: 'reception/JWS03604-2.jpg',   alt: 'Pendant lights over the split stone wall at reception', crop: { left: 0.02, top: 0.04, width: 0.60, height: 0.62 } },
  { slug: 'reception-wide',   src: 'reception/JWS03639-2.jpg',   alt: 'The fluted glass door onto the arrival hall', crop: { width: 0.46 } },
  { slug: 'dining-room',      src: 'dining/JWS03779-HDR.jpg',    alt: 'The dining room laid for breakfast service' },
  { slug: 'dining-wide',      src: 'dining/JWS03754-HDR.jpg',    alt: 'Dining room looking toward the windows' },
  { slug: 'dining-counter',   src: 'dining/JWS03805-HDR.jpg',    alt: 'The breakfast counter and service line' },
  { slug: 'conference-room',  src: 'conference-room/JWS03574.jpg', alt: 'The conference room set for a working session' },
  { slug: 'conference-wide',  src: 'conference-room/JWS03564.jpg', alt: 'Conference room with projection wall' },
  { slug: 'common-area',      src: 'common-area/JWS03430.jpg',   alt: 'The common lounge on the upper floor' },
  { slug: 'common-wide',      src: 'common-area/JWS03410.jpg',   alt: 'Long view across the common area' },
  { slug: 'breakfast-plate',  src: 'june/CAT00160.jpg',          alt: 'South Indian breakfast plated with sambar and chutney' },
];

// `trim` is { start, duration } in seconds, and `poster` is an offset into
// the trimmed clip.
//
// reel-tea is cut in at 3.2s: the original opens on a phone showing a WiFi
// panel with the guest's account name and a list of neighbouring households'
// private network names. reel-common is cut at 10.5s, before a television
// showing a third-party service. Neither belongs on a published page.
export const VIDEOS = [
  {
    slug: 'reel-morning',
    src: 'vapr_june_001.mp4',
    alt: 'Housekeeping making up a room in the morning',
    poster: 2.5,
  },
  {
    slug: 'reel-tea',
    src: 'vapr_june_002.mp4',
    alt: 'Working at the desk, and tea made in the room',
    trim: { start: 3.2, duration: 13 },
    poster: 3.4,
  },
  {
    slug: 'reel-common',
    src: 'vapr_june_004.mp4',
    alt: 'Guests around the long table in the common room',
    trim: { start: 0, duration: 10.5 },
    poster: 2.6,
  },
];

// The photographs ship in their original colour. The source set is already
// HDR-processed and well exposed, so this is a pass-through rather than a
// grade — nothing is neutralised, warmed, or crushed on the way out.
export const GRADE = img => img;
export const WIDTHS = [640, 1080, 1600, 2400];
