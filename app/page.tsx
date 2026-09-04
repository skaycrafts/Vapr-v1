import Hero from '@/components/sections/Hero';
import Locations from '@/components/sections/Locations';
import Chennai from '@/components/sections/Chennai';
import Rooms from '@/components/sections/Rooms';
import Spaces from '@/components/sections/Spaces';
import Reel from '@/components/sections/Reel';
import Detail from '@/components/sections/Detail';
import Reserve from '@/components/sections/Reserve';
import Chapter from '@/motion/primitives/Chapter';

/**
 * The order is the story: who we are, which one, the city, the room, the rest
 * of the building, the hotel in use, the specification, and then the one thing
 * left to do.
 *
 * ── On which sections are wrapped ────────────────────────────────────────
 * `<Chapter>` gives a section a departure — it drifts up and dims as it
 * leaves, so it is still moving when the next one arrives underneath and the
 * join is hidden inside the movement rather than being a butt cut.
 *
 * It is applied to the sections that scroll past normally, and deliberately
 * NOT to Chennai, Rooms or Spaces. Those three are pinned, and ScrollTrigger
 * pins with `position: fixed` — which resolves against the nearest
 * *transformed* ancestor rather than the viewport. Wrapping a pinned section
 * in an element that carries a transform does not merely look wrong, it
 * detaches the pin from the viewport entirely and the scene slides away
 * mid-scroll. The three pinned scenes already own their own entrances and
 * exits, so they lose nothing by being left alone.
 *
 * Hero is excluded for the same reason in reverse: it has always run its own
 * departure, timed against the entry sequence.
 */
export default function Home() {
  return (
    <>
      <Hero />

      {/* Directly under the hero: a two-property group has to answer "which
          one?" before it answers anything else. */}
      <Chapter as="div">
        <Locations />
      </Chapter>

      {/* Pinned. The chapter carries the sentence the manifesto used to hold,
          and sits in the same slot — the hero's scroll cue points here. */}
      <Chennai />
      <Rooms />
      <Spaces />

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
    </>
  );
}
