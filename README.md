# VAPR

Booking-enquiry site for VAPR, two small hotels in Chennai: **Ashok Nagar** and
**Guindy** (Ekkatuthangal).

Three routes — `/` introduces both and sends the enquiry, `/ashok-nagar` and
`/guindy` are the properties. All three are statically prerendered.

```bash
npm install
npm run media     # crop, resize and encode the media (see below)
npm run dev
```

---

## Before this goes live

Three things are outstanding, and all three are marked in the code.

**1. Placeholder facts.** `lib/content.ts` exports `needsVerification`: the
phone number, the inbox, the WhatsApp number and the nightly rate. Those four
are the only invented values on the site.

Everything else about the properties — room categories and their inclusions,
facilities, what is *not* available, guest ratings, room counts, check-in
times, addresses and landmark distances — is taken from each hotel's own Treebo
listing and is cited at the top of `lib/content.ts`. If a fact is not on the
listing, it is not asserted anywhere.

**Guindy has no photography.** Every image and clip supplied was shot at Ashok
Nagar — the facade signage confirms it, and nothing in the source folders
refers to Ekkatuthangal. Rather than show one hotel's rooms on the other's
page, `/guindy` renders a designed placeholder wherever its pictures belong,
and its `images` array in `lib/content.ts` is empty. Fill that array once the
shoot happens and the placeholders disappear on their own.

**2. The source media is not in the repository.** The web-ready renditions in
`public/media` are committed. The originals live in
`media-source/`, which is gitignored — roughly 800 MB of camera files. Restore
that folder from the client's Drive before re-running `npm run media`.

---

## The two properties

`LOCATIONS` in `lib/content.ts` is the single source. A property page is
generated per entry via `generateStaticParams`, so adding a third hotel is one
object — route, metadata, schema, the enquiry selector and both footer columns
all follow from it.

Guest ratings are shown with their source named and are deliberately **not**
marked up as `aggregateRating`: those reviews were collected by a booking
platform, not by this site, and claiming them as first-party structured data
would be misrepresentation.

---

## The design

Black and white carry the page; grey is a minority voice used for hairlines,
captions and disabled states, never for body copy. The palette is defined once
in `app/globals.css`, in OKLCH, with the contrast ratio of each ink token
against the page black noted beside it.

**The photography ships in its original colour.** The interface around it stays
monochrome, so the black ground and white type frame the pictures rather than
competing with them — the ochre facade and the green room walls are the only
colour on the page, which is what makes them read.

The building operates under a franchise whose signage and livery appear
throughout the source frames. Six photographs are cropped so that branding
falls outside the frame: the facade shots sit above the street sign, and the
reception crop holds the stone wall and pendants rather than the desk. Those
crops live in `scripts/media.config.mjs` and matter more in colour than they
did in grey — re-check them if the photography is ever re-exported.

**Type is one Didone and one grotesque.** The wordmark inside the VAPR seal is
a high-contrast Didone, so Bodoni Moda sets the display type and the logo and
the headings speak the same language. Archivo carries everything else, using
its width axis for the contrast a second family would normally supply — which
avoids pairing two grotesques that are similar but not identical.

**The seal is redrawn as vector** in `components/brand/Emblem.tsx` so it can be
drawn on with `stroke-dashoffset` during the entry sequence. It has three
variants; `simple` exists because below about 60px the hairline detail turns to
mush and the mark stops reading.

---

## Motion

Lenis drives the scroll and hands ScrollTrigger the same clock, so scrubbed
timelines stay locked to the smoothed position instead of trailing it by a
frame (`components/providers/SmoothScroll.tsx`).

Every animated surface has a still counterpart:

| Surface | With motion | Reduced motion |
|---|---|---|
| Entry sequence | Seal draws on, counter runs, field lifts | Short fade |
| Manifesto | Pinned, lit one word at a time | A paragraph |
| Rooms | Pinned horizontal rail | Stacked vertically |
| Hero | WebGL dissolve between three stills | The photograph, still |
| Spaces | Image follows the cursor | Images inline under each row |
| Cursor | Hairline ring with captions | Not mounted |

The entry sequence is rendered unconditionally on server and client, and
decides for itself whether to play. Choosing in the parent instead meant the
server emitted the overlay while the client declined to render it, and the
orphaned node stayed on screen covering the whole page on every navigation
after the first. An inline script in the document head hides it before first
paint on a repeat visit, so skipping costs no flash.

Reveals animate *from* a state set by script, never *to* one — so if a timeline
never runs, the content is already visible. The entry sequence is an overlay,
not a gate: the page is fully rendered underneath it the whole time, and it is
skipped on repeat visits within a session.

---

## Performance

Measured against `next build && next start` at 1440×900:

| | |
|---|---|
| LCP | ~210 ms |
| CLS | 0 |
| Images, first load | ~480 KB (AVIF) |
| Fonts | 133 KB (two variable faces) |
| JS | ~445 KB encoded, most of it three.js in a deferred chunk |

The WebGL hero is additive, never load-bearing. The photograph renders underneath it
and carries the LCP; the canvas composites on top and fades in.
If the GPU drops the context, a texture fails, or the device looks modest
(`lib/useCapability.ts`), the canvas stops painting and the photograph is
already there. The hero `<img>` carries `crossOrigin="anonymous"` to share a
cache entry with the three.js texture loader — without it the same 153 KB file
is fetched twice.

---

## Media pipeline

`npm run media` reads `scripts/media.config.mjs`, crops and resizes the stills
into responsive AVIF and WebP, encodes the video, and writes a typed manifest
with inline blur placeholders to `lib/media.generated.ts`. Colour is passed
through untouched; `GRADE` in the config is the hook if that ever changes. Do not edit the
manifest; edit the config and re-run. `--force` ignores the freshness check,
and `--images` / `--videos` limit the pass.

**Two clips are trimmed for privacy, not for pacing.** `reel-tea` starts at
3.2 s because the original opens on a phone screen showing an account name and
a list of neighbouring households' private WiFi network names. `reel-common`
ends at 10.5 s, before a television displaying a third-party service. If the
source footage is ever re-exported, re-check those cuts.

---

## Structure

```
app/                    layout, tokens, home, and /[location]
components/
  brand/Emblem          the seal, as animatable vector
  chrome/               nav, entry sequence, cursor, grain
  media/Frame           responsive picture with a blur placeholder
  providers/            Lenis + ScrollTrigger, entry-sequence state
  property/             the per-hotel page: hero, room, getting there
  sections/             the home page, in order
  ui/Glass              liquid glass; used on the nav and the reserve panel only
  webgl/HeroCanvas      the hero dissolve
lib/
  content.ts            every string, and LOCATIONS — the source of truth
  media.generated.ts    written by the pipeline
  useCapability.ts      decides who gets the shader
scripts/
  media.config.mjs      which photographs, cropped how, with what alt text
  optimize-media.mjs    the pipeline
  shots.mjs             design-review capture (Playwright)
```

`scripts/shots.mjs` drives a real Chromium, walks the page so every
ScrollTrigger and IntersectionObserver has fired, and writes one PNG per stop.
`--reduced` runs it with reduced motion; `--w 390 --h 844` for a phone.

---

## Notes on the enquiry form

There is no booking engine, so the reserve panel does not pretend to be one. It
asks which hotel, when, and how many, composes the enquiry the guest would
otherwise have to type, and hands it to WhatsApp or their mail client with the
message already written. A property page preselects itself. If a real booking
system is added later, this is the component to replace.
