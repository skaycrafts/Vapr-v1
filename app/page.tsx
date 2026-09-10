import Hero from '@/components/sections/Hero';
import Locations from '@/components/sections/Locations';
import Chennai from '@/components/sections/Chennai';
import Reel from '@/components/sections/Reel';
import Detail from '@/components/sections/Detail';
import Reserve from '@/components/sections/Reserve';
import Chapter from '@/motion/primitives/Chapter';

/**
 * The homepage is the brand and the choice; the buildings are their own pages.
 *
 * ── What moved, and why ──────────────────────────────────────────────────
 * It used to carry two generic sections between Chennai and the reel: "The
 * rooms", which ran Maple and Deluxe past in a horizontal track, and "The rest
 * of it", which walked through the six shared rooms. Both have gone to the
 * property pages.
 *
 * They were in the wrong place rather than badly made. Maple belongs to Ashok
 * Nagar and Deluxe belongs to Guindy; the Meeting Room is a room in a specific
 * building. Presented on the homepage they asked a visitor to hold two
 * hotels' worth of specification in their head before the page had settled
 * which one they were looking at — and then the property pages repeated most
 * of it anyway. Now the homepage answers "who are you" and "which one", and
 * each property answers everything else.
 *
 * Nothing was deleted. `components/sections/Rooms.tsx` is unimported but kept:
 * the room content it renders now lives in `PropertyRoom`, and the horizontal
 * track is there if the group ever wants a rooms page of its own.
 *
 * ── On which sections are wrapped ────────────────────────────────────────
 * `<Chapter>` gives a section a departure — it drifts up and dims as it
 * leaves, so it is still moving when the next one arrives underneath and the
 * join is hidden inside the movement rather than being a butt cut.
 *
 * It is applied to the sections that scroll past normally, and deliberately
 * NOT to Chennai. Chennai is pinned, and ScrollTrigger pins with
 * `position: fixed` — which resolves against the nearest *transformed*
 * ancestor rather than the viewport. Wrapping a pinned section in an element
 * that carries a transform does not merely look wrong, it detaches the pin
 * from the viewport entirely and the scene slides away mid-scroll.
 *
 * Hero is excluded for the same reason in reverse: it has always run its own
 * departure, timed against the entry sequence.
 */
export default function Home() {
  return (
    <>
      <Hero />

      {/*
        Everything after the hero rides over it.

        The hero is `sticky top-0 z-0`; this stack is `relative z-10` with
        opaque grounds, so as it scrolls up it covers the hero with a hard
        horizontal edge instead of pushing it off the top. The hero releases
        on its own when `main` ends, and the footer — which is outside `main`
        — is unaffected.
      */}
      <div className="relative z-10">

      {/*
        Directly under the hero: a two-property group has to answer "which
        one?" before it answers anything else. It answers it and hands over —
        the full-height property stage that used to sit here has gone, now
        that both hotels have a page carrying every fact it showed.

        Deliberately NOT in a <Chapter>. This is the section that performs the
        cover, and a chapter's departure fades its content to 0.3 starting a
        half-viewport before it leaves — which for a section this short begins
        while it is still climbing over the hero. Measured: 0.731 opacity at a
        scroll of 800 with the hero still visible behind it, which is exactly
        the ghosting. A section cannot both hide the hero and become
        translucent over it, and of the two jobs the cover is the one that
        matters here.
      */}
      <Locations />

      {/* Pinned. The chapter carries the sentence the manifesto used to hold,
          and sits in the same slot — the hero's scroll cue points here. */}
      <Chennai />

      <Chapter as="div">
        <Reel />
      </Chapter>
      <Chapter as="div">
        <Detail />
      </Chapter>

      {/* The last chapter before the footer. It dims on the way out like the
          rest, but only once its bottom edge is near the top of the frame —
          long after anyone has finished typing into it. */}
      <Chapter as="div">
        <Reserve />
      </Chapter>
      </div>
    </>
  );
}
