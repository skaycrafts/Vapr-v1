# VAPR

Marketing site for VAPR, a small hotel in Ashok Nagar, Chennai.

```bash
npm install
npm run media     # crop, resize and encode the media (see below)
npm run dev
```

---

## Before this goes live

Two things are deliberately unfinished, and both are marked in the code.

**1. Placeholder facts.** `lib/content.ts` exports `needsVerification`. Every
value in it — the phone number, the inbox, the WhatsApp number, the nightly
rate, the road distances and the map coordinates — is either a placeholder or
a best-effort guess. Replace them with the property's real details. Nothing
else on the site invents a fact; all the copy about the building was written
from the photography.

**2. The source media is not in the repository.** The web-ready renditions in
`public/media` are committed. The originals live in
`media-source/`, which is gitignored — roughly 800 MB of camera files. Restore
that folder from the client's Drive before re-running `npm run media`.

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
app/                    layout, tokens, the single route
components/
  brand/Emblem          the seal, as animatable vector
  chrome/               nav, entry sequence, cursor, grain
  media/Frame           responsive picture with a blur placeholder
  providers/            Lenis + ScrollTrigger, entry-sequence state
  sections/             the page, in order
  ui/Glass              liquid glass; used on the nav and the reserve panel only
  webgl/HeroCanvas      the hero dissolve
lib/
  content.ts            every string on the site
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
composes the enquiry the guest would otherwise type and hands it to WhatsApp or
their mail client with the message already written. If a real booking system is
added later, this is the component to replace.
