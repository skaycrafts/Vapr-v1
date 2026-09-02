'use client';

import { useRef } from 'react';
import Emblem from '@/components/brand/Emblem';
import { CHENNAI } from '@/lib/content';
import { gsap } from '@/lib/gsap';
import { useMotionEffect } from '@/motion/useMotionEffect';
import { EASE, SCRUB } from '@/motion/config';

/**
 * The chapter. Chennai arrives all at once, and then it stops.
 *
 * The whole scene is one scrubbed timeline inside a pin, so the visitor's
 * scroll *is* the edit — they set the pace of the sentence, and they can run
 * it backwards. Nothing here is on a clock of its own.
 *
 * Three movements:
 *
 *   1. CHENNAI, very large, alone.
 *   2. The noise: four words stacking up, each arriving before the last has
 *      finished, until the frame is as crowded as the street. This is the only
 *      place on the site where things overlap untidily, and it is deliberate.
 *   3. The turn. Everything leaves at once, and there is a genuine beat of
 *      nothing — a full stride of scroll with no animation scheduled at all.
 *      That pause is the point of the section: without it the mark at the end
 *      is another logo, and with it the mark reads as relief.
 *
 * The restraint at the end is absolute. The seal does not spin, draw, pulse or
 * shimmer. It fades up, and it sits there.
 *
 * ── On the two layouts ──────────────────────────────────────────────────
 * The stacked, overlapping composition only exists when the scene is actually
 * running. `data-scene` is set imperatively by the motion effect, which runs
 * only when the device has agreed to motion — so a visitor with scripting off,
 * or one who asked for reduced motion, gets the same words as an ordinary
 * vertical column: in order, in flow, all visible. Nothing here is hidden in
 * CSS and revealed by script, because anything hidden that way stays hidden
 * when the script does not arrive.
 */

/**
 * Where the four words sit once the scene engages.
 *
 * Expressed as CSS rather than utility classes because the constraint is
 * geometric and needs to be stated as one: every word must stay clear of the
 * band the title occupies.
 *
 * Percentages of the stage cannot express that. The title's size is capped in
 * pixels (`clamp(3rem, 16vw, 12rem)`) while the stage is a share of the
 * viewport *height*, so as the window gets shorter the title takes up a
 * steadily deeper fraction of it — a word parked at a fixed 22% clears the
 * title at 900px tall and lands on top of it at 680px.
 *
 * So the words are anchored to the same centre line the title is centred on:
 * the upper two measure up from it, the lower two measure down. `--band` is
 * half the title's own height plus a gap, in the title's own units, which
 * makes the clearance hold at any viewport.
 */
const NOISE_PLACEMENT_CSS = `
  #chennai[data-scene='on'] .chennai-noise {
    position: absolute;

    /* Half the title's height. Mirrors its own clamp(3rem, 16vw, 12rem). */
    --half: min(8vw, 96px);

    /* The title does not hold still — it drifts up by 8% of its height as the
       noise arrives, so it walks into anything parked above it. That travel
       has to be part of the clearance, not discovered afterwards. */
    --drift: calc(var(--half) * 0.16);

    /* Up needs the drift; down gets it for free, as the title moves away. */
    --band-up: calc(var(--half) + var(--drift) + 22px);
    --band-down: calc(var(--half) + 22px);
  }

  /* Heat — top left, the first thing that hits you. */
  #chennai[data-scene='on'] .chennai-noise:nth-child(1) {
    bottom: calc(50% + var(--band-up) + 40px);
    left: 6%;
  }
  /* Traffic — above the title rather than across it. */
  #chennai[data-scene='on'] .chennai-noise:nth-child(2) {
    bottom: calc(50% + var(--band-up));
    left: 44%;
  }
  /* Horns — below the title, on the left. */
  #chennai[data-scene='on'] .chennai-noise:nth-child(3) {
    top: calc(50% + var(--band-down));
    left: 8%;
  }
  /* Glare — bottom right, out of the way of the attribution line. */
  #chennai[data-scene='on'] .chennai-noise:nth-child(4) {
    top: calc(50% + var(--band-down) + 60px);
    left: 40%;
  }

  /* Wider screens have room to push the two right-hand words further out. */
  @media (min-width: 768px) {
    #chennai[data-scene='on'] .chennai-noise:nth-child(1) { left: 8%; }
    #chennai[data-scene='on'] .chennai-noise:nth-child(2) { left: 55%; }
    #chennai[data-scene='on'] .chennai-noise:nth-child(3) { left: 10%; }
    #chennai[data-scene='on'] .chennai-noise:nth-child(4) { left: 68%; }
  }
`;

export default function Chennai() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useMotionEffect(root, ({ q }) => {
    const el = root.current;
    const scene = stage.current;
    if (!el || !scene) return;

    // Switches the column into the stacked composition. Set here rather than
    // in the markup so it is impossible for the layout to engage without the
    // timeline that makes it readable.
    el.dataset.scene = 'on';

    const noise = q('.chennai-noise');

    /**
     * ── 1. The city, named. ──────────────────────────────────────────────
     *
     * On its own trigger, tied to the section's *approach* rather than to the
     * pinned timeline below. It used to sit at position 0 of that timeline,
     * which does not start until the section has reached the top of the
     * viewport — so the whole approach was a viewport of black with the title
     * waiting invisibly at the end of it.
     *
     * Now it is fully in by the time the section is a third of the way up the
     * screen, and then holds, still, until the pin takes over. The stillness
     * between the two is deliberate: the word arrives, and is left alone.
     */
    gsap.fromTo(
      '.chennai-title',
      { yPercent: 18, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        ease: EASE.none,
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          end: 'top 35%',
          scrub: SCRUB.weighted,
        },
      }
    );

    const tl = gsap.timeline({
      defaults: { ease: EASE.none },
      scrollTrigger: {
        trigger: el,
        start: 'top top',
        // 260vh of travel for one viewport of content: the scene needs room
        // to breathe, and the silence needs room to be uncomfortable.
        end: '+=260%',
        pin: scene,
        // Pre-empts the pin's layout shift on fast scrolls, which otherwise
        // shows as a one-frame jump at the moment of pinning.
        anticipatePin: 1,
        scrub: SCRUB.weighted,
        invalidateOnRefresh: true,
      },
    });

    // Drifts up and dims rather than cutting, so the noise arrives over the
    // top of the title while it is still leaving. Kept to 8%: the placement
    // CSS above reserves clearance for exactly this much travel, and a larger
    // drift walks the title into the words parked above it.
    tl.to('.chennai-title', { yPercent: -8, opacity: 0.12, duration: 0.8 }, 0.6);

    // ── 2. The noise. ────────────────────────────────────────────────────
    // Each word enters before the previous has settled. The overlap is what
    // makes four words feel like a crowd rather than a list.
    noise.forEach((word, i) => {
      const at = 0.8 + i * 0.55;

      tl.fromTo(
        word,
        { opacity: 0, scale: 0.94, filter: 'blur(6px)' },
        { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.5, ease: EASE.out },
        at
      );

      // A slow drift while it is on screen, each at its own rate, so the
      // stack never settles into a static composition.
      tl.to(word, { yPercent: i % 2 === 0 ? -7 : 5, duration: 1.6 }, at);
    });

    // ── 3. The turn. ─────────────────────────────────────────────────────
    // Everything goes at once. A stagger would soften it, and this is the one
    // moment on the site that should be abrupt.
    tl.to(noise, { opacity: 0, filter: 'blur(10px)', duration: 0.45, ease: EASE.inOut }, 3.2).to(
      '.chennai-title',
      { opacity: 0, duration: 0.3 },
      3.2
    );

    // ── The silence. ─────────────────────────────────────────────────────
    // Nothing is scheduled between 3.65 and 4.35. The gap is the animation.

    tl.fromTo(
      '.chennai-turn',
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5, ease: EASE.out },
      4.35
    )
      .fromTo(
        '.chennai-resolution',
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.5, ease: EASE.out },
        4.9
      )
      // The mark, last, and barely.
      .fromTo('.chennai-seal', { opacity: 0 }, { opacity: 1, duration: 0.7 }, 5.3)
      .fromTo(
        '.chennai-closing',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.6, ease: EASE.out },
        5.6
      )
      // The attribution belongs to this block and was the one part of it with
      // no animation at all — so it sat at full opacity through the noise,
      // which is what "Glare" was colliding with.
      .fromTo('.chennai-attribution', { opacity: 0 }, { opacity: 1, duration: 0.5 }, 5.9);

    return () => {
      delete el.dataset.scene;
    };
  });

  return (
    <section
      ref={root}
      id="chennai"
      aria-label="Chennai, and what VAPR is for"
      className="group relative mt-[8vh] bg-void md:mt-[14vh]"
    >
      <style>{NOISE_PLACEMENT_CSS}</style>
      <div
        ref={stage}
        className="gutter mx-auto flex max-w-6xl flex-col items-center gap-12 py-24 text-center group-data-[scene=on]:grid group-data-[scene=on]:h-[100svh] group-data-[scene=on]:max-w-6xl group-data-[scene=on]:gap-0 group-data-[scene=on]:place-items-center group-data-[scene=on]:overflow-hidden group-data-[scene=on]:py-0"
      >
        <h2 className="chennai-title type-display text-[clamp(3rem,16vw,12rem)] leading-none tracking-[-0.03em] text-chalk group-data-[scene=on]:col-start-1 group-data-[scene=on]:row-start-1">
          {CHENNAI.city}
        </h2>

        {/*
          In flow this is an ordinary list of what the street is like. Once the
          scene engages, the same four items become an overlapping composition
          — the inline `top`/`left` below are inert until `position: absolute`
          is applied, so one set of markup serves both layouts.
        */}
        <ul className="flex flex-col items-center gap-6 group-data-[scene=on]:col-start-1 group-data-[scene=on]:row-start-1 group-data-[scene=on]:block group-data-[scene=on]:h-full group-data-[scene=on]:w-full">
          {CHENNAI.noise.map((item) => (
            <li
              key={item.word}
              // Placement lives in NOISE_PLACEMENT_CSS above, which anchors
              // each word to the title's centre line so nothing lands on it.
              className="chennai-noise"
            >
              <span className="type-display block text-[clamp(2rem,7vw,5.5rem)] leading-none text-chalk group-data-[scene=on]:text-left">
                {item.word}
              </span>
              <span className="type-label mt-2 block group-data-[scene=on]:text-left">
                {item.note}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col items-center group-data-[scene=on]:col-start-1 group-data-[scene=on]:row-start-1">
          <Emblem
            variant="mark"
            aria-hidden
            className="chennai-seal w-[min(22vw,7rem)] text-chalk"
          />

          <p className="chennai-turn type-display mt-8 max-w-[18ch] text-[clamp(1.5rem,4vw,2.75rem)] leading-[1.15] text-chalk">
            {CHENNAI.turn}
          </p>

          <p className="chennai-resolution type-display mt-3 text-[clamp(1.5rem,4vw,2.75rem)] leading-[1.15] text-mist">
            {CHENNAI.resolution}
          </p>

          <p className="chennai-closing mt-8 max-w-[46ch] text-balance leading-relaxed text-smoke">
            {CHENNAI.closing}
          </p>

          <p className="chennai-attribution type-label mt-10">{CHENNAI.attribution}</p>
        </div>
      </div>
    </section>
  );
}
