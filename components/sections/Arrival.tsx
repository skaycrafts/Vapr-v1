'use client';

import { useRef } from 'react';
import Frame from '@/components/media/Frame';
import RevealImage from '@/motion/primitives/RevealImage';
import { gsap } from '@/lib/gsap';
import { useMotionEffect } from '@/motion/useMotionEffect';
import { EASE, SCRUB } from '@/motion/config';

/**
 * The building, lit, immediately before the page asks you to write to it.
 *
 * ── Why a photograph and no words ───────────────────────────────────────
 * Everything above this has been telling: two hotels, a pinned scene, a
 * specification sheet. The enquiry underneath is the one thing on the page
 * that asks the visitor to do work. A silent full-bleed frame between the two
 * is a breath — it says "this is the place" without a sentence, and it lets
 * the section under it open on an empty ground rather than arriving on the
 * back of a paragraph.
 *
 * No caption, no heading, no overlaid line. There is nothing true to write
 * here that the page has not already said, and a caption invented to fill the
 * space would be exactly that.
 *
 * ── The frame ───────────────────────────────────────────────────────────
 * `facade-signed` is the same negative as `facade-dusk`, which the manifest
 * crops to its top 66% and which the site uses only for its share cards.
 * Uncropped it keeps the gate sign, and the sign is the reason to run it: the
 * building is named on it, lit, at the hour it is lit. It also carries the
 * operating franchise's mark, which is against the standing note in
 * `scripts/media.config.mjs` and is deliberate — it was supplied this way.
 *
 * Locked to a wide ratio rather than the negative's own 3:2. At full height a
 * 3:2 frame this wide is taller than most laptops and the enquiry would be
 * pushed a whole screen down; the crop holds the tree canopy and the sign,
 * which is the whole of the composition, and drops sky.
 */
export default function Arrival() {
  const root = useRef<HTMLElement>(null);

  useMotionEffect(root, () => {
    // The frame drifts against the scroll, so the band reads as a window onto
    // something continuous rather than a picture that was pasted in. Scrubbed
    // and slow — this is scenery, not an event (§10).
    gsap.fromTo(
      '.arrival-plate img',
      { yPercent: -6 },
      {
        yPercent: 6,
        ease: EASE.none,
        scrollTrigger: {
          trigger: root.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: SCRUB.tight,
        },
      }
    );
  });

  /*
   * Deliberately not `aria-hidden`. The band carries no caption, but the
   * photograph is of a named building and its alt text says so — that is
   * content, not decoration, and hiding it would take the one description of
   * the place away from the people who most need it. A section with no
   * accessible name is not exposed as a landmark, so this adds no empty
   * region to the document outline either.
   */
  return (
    <section ref={root} className="relative overflow-hidden bg-void">
      {/* `curtain` is the loudest of the reveals and the right one here: this
          is a single full-width frame with nothing competing for attention,
          which is the case the treatment was written for. */}
      <RevealImage style="curtain" start="top 88%">
        <Frame
          slug="facade-signed"
          className="arrival-plate w-full"
          ratio={2.1}
          sizes="100vw"
          position="50% 62%"
        />
      </RevealImage>

      {/* Both edges land into the page's black so the band has no hard seam
          against the sections either side of it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 md:h-32"
        style={{
          background: 'linear-gradient(to bottom, var(--color-void), transparent)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 md:h-32"
        style={{
          background: 'linear-gradient(to top, var(--color-void), transparent)',
        }}
      />
    </section>
  );
}
