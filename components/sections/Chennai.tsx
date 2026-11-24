'use client';

import { useRef } from 'react';
import Emblem from '@/components/brand/Emblem';
import { CHENNAI } from '@/lib/content';
import { gsap } from '@/lib/gsap';
import { useMotionEffect } from '@/motion/useMotionEffect';
import { useCapability } from '@/motion/capability';
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

    /* Half the title's height. Mirrors its own clamp(3rem, 16vw, 18rem). */
    --half: min(8vw, 144px);

    /* The title does not hold still — it drifts up by 8% of its height as the
       noise arrives, so it walks into anything parked above it. That travel
       has to be part of the clearance, not discovered afterwards. */
    --drift: calc(var(--half) * 0.16);

    /* Up needs the drift; down gets it for free, as the title moves away. */
    --band-up: calc(var(--half) + var(--drift) + 22px);
    --band-down: calc(var(--half) + 22px);

    /*
     * The word's own height: the display line, plus the label under it and
     * the gap between them. Measured rather than guessed — the label and its
     * margin come to 26px at every size, because only the word above it
     * scales.
     *
     * It exists so the placement can be clamped against the stage's edges.
     * Everything above measures from the centre line outwards, which keeps
     * the words clear of the title but says nothing about where they stop:
     * on a short window the fourth word, which sits furthest from the
     * centre, ran straight off the bottom of the stage and was cut in half.
     */
    --word-h: calc(clamp(2rem, 7vw, 7rem) + 26px);
    --edge: 24px;
  }

  /*
   * The four words and the title are the only things in the scene that move,
   * and they move for the whole of it — so they are promoted for the whole
   * of it. Each gets a layer of its own, the fades and the scale run on the
   * compositor against a texture, and no frame of the scrub re-rasterises
   * display type. Scoped to the scene: the same elements in the plain
   * layout are static text and ask for nothing.
   */
  #chennai[data-scene='on'] .chennai-noise,
  #chennai[data-scene='on'] .chennai-title {
    will-change: transform, opacity;
  }

  /*
   * Each word is placed from the centre line and then held inside the stage.
   *
   * A min() on a distance from an edge is a floor on how far out the word can
   * be pushed: the first term is where the composition wants it, the second
   * is the furthest it can go and still be whole. On a tall window the first
   * term wins and nothing is different; on a short one the second takes over
   * and the word stops at the edge instead of crossing it.
   */

  /* First — top left, the furthest out, so the first to meet the top edge. */
  #chennai[data-scene='on'] .chennai-noise:nth-child(1) {
    bottom: min(calc(50% + var(--band-up) + 40px), calc(100% - var(--word-h) - var(--edge)));
    left: 6%;
  }
  /* Second — above the title rather than across it. */
  #chennai[data-scene='on'] .chennai-noise:nth-child(2) {
    bottom: min(calc(50% + var(--band-up)), calc(100% - var(--word-h) - var(--edge)));
    left: 44%;
  }
  /* Third — below the title, on the left. */
  #chennai[data-scene='on'] .chennai-noise:nth-child(3) {
    top: min(calc(50% + var(--band-down)), calc(100% - var(--word-h) - var(--edge)));
    left: 8%;
  }
  /* Fourth — bottom right, and the one that was being cut. */
  #chennai[data-scene='on'] .chennai-noise:nth-child(4) {
    top: min(calc(50% + var(--band-down) + 60px), calc(100% - var(--word-h) - var(--edge)));
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
  const { pointerMotion } = useCapability();

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
     * Now it starts the moment the section's edge appears and is fully in
     * within about one gesture, then holds, still, until the pin takes over.
     * The stillness between the two is deliberate: the word arrives, and is
     * left alone.
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
          // Begins the instant the section's top edge clears the bottom of the
          // viewport and is fully in less than half a screen later — about one
          // gesture. It used to need half a viewport before it even started.
          start: 'top bottom',
          end: 'top 58%',
          scrub: SCRUB.weighted,
        },
      }
    );

    const tl = gsap.timeline({
      defaults: { ease: EASE.none },
      scrollTrigger: {
        /*
         * ── Why there is no `pin` here ─────────────────────────────────────
         *
         * The scene used to be pinned by ScrollTrigger. It held the stage
         * still by writing a transform on it from the scroll handler, which
         * means the stage is only in the right place if JavaScript runs in
         * the same frame the browser scrolled in. Under a fast wheel or a
         * flick it does not: the page moves, the stage is told to catch up a
         * frame later, and the whole composition slides and snaps back.
         * Measured on the production build, the stage left the top of the
         * window by as much as 107px, on twelve frames of one swipe. That
         * was the glitch — not the fades, the frame they sit in.
         *
         * `position: sticky` (set on the stage in the markup, and only once
         * the scene engages) is the same behaviour handed to the compositor:
         * the stage is held at the top of the window by the browser itself,
         * so it cannot lag by a frame, and nothing is taken out of flow, so
         * there is no layout shift either — which is what the transform pin
         * was chosen for in the first place. The section carries the travel
         * as its own height (290svh: one screen of stage, 190 of scroll),
         * which is exactly what the pin's spacer used to add.
         *
         * So this trigger now only reads the scroll. `top top` is the moment
         * the stage sticks; `bottom bottom` is the moment it lets go.
         */
        trigger: el,
        start: 'top top',
        end: 'bottom bottom',
        scrub: SCRUB.weighted,
        invalidateOnRefresh: true,
      },
    });

    // Drifts up and dims rather than cutting, so the noise arrives over the
    // top of the title while it is still leaving. Kept to 8%: the placement
    // CSS above reserves clearance for exactly this much travel, and a larger
    // drift walks the title into the words parked above it.
    tl.to('.chennai-title', { yPercent: -8, opacity: 0.12, duration: 0.7 }, 0.5);

    // ── 2. The noise. ────────────────────────────────────────────────────
    // Each word enters before the previous has settled. The overlap is what
    // makes four words feel like a crowd rather than a list.
    /*
     * How much scroll a word gets to arrive in.
     *
     * The fade is scrubbed, so its duration is really a distance: the pin
     * runs 190vh over about five and a half timeline units, which put half a
     * unit at roughly 130px of scroll. A swipe covers that in four frames,
     * and measured on a phone the first word's opacity moved 0.3 in a single
     * frame — it did not fade, it appeared in steps.
     *
     * Nearly twice the duration spends nearly twice the scroll on each
     * arrival. The words overlap more as a result, which is what this
     * sequence wanted anyway: each is meant to enter before the one before
     * it has settled. The last still completes at 2.95, comfortably ahead of
     * the turn at 3.2.
     */
    const ARRIVAL = 0.9;

    noise.forEach((word, i) => {
      const at = 0.7 + i * 0.45;

      /*
       * Opacity, and a scale on devices with capacity for it. No blur.
       *
       * A scrubbed `filter: blur()` was the most expensive thing on this
       * page: every frame of the scrub re-rasterises the word at a new
       * radius, at 7vw, four words deep, and it was dropped on phones for
       * exactly that reason. It is gone on the desktop too. The arrival
       * reads the same — a word fading up and settling — and the frames
       * that were going into re-rastering glyphs now go into drawing them.
       *
       * The scale stays where there is capacity, and the word is promoted
       * for it in the markup, so the scale runs on the compositor against a
       * texture rather than re-rastering type at every step.
       */
      tl.fromTo(
        word,
        {
          opacity: 0,
          ...(pointerMotion ? { scale: 0.94 } : {}),
        },
        {
          opacity: 1,
          ...(pointerMotion ? { scale: 1 } : {}),
          duration: ARRIVAL,
          ease: EASE.out,
        },
        at
      );

      // A slow drift while it is on screen, each at its own rate, so the
      // stack never settles into a static composition.
      tl.to(word, { yPercent: i % 2 === 0 ? -7 : 5, duration: 1.4 }, at);
    });

    /**
     * ── 3. The turn. ─────────────────────────────────────────────────────
     *
     * Everything goes at once. A stagger would soften it, and this is the one
     * moment on the site that should be abrupt.
     *
     * At 2.6 it was too soon to be abrupt — it was early. The fourth word
     * starts arriving at 2.05 and is not fully in until 2.55, so it had five
     * hundredths of the timeline on screen before the turn took it: about a
     * dozen pixels of scroll on a laptop. The word that completes the
     * sentence — a stay worth remembering — was the one nobody ever read.
     * 3.2 gives it a held beat, the same as the three words before it.
     */
    tl.to(
      noise,
      {
        opacity: 0,
        duration: 0.45,
        ease: EASE.inOut,
      },
      3.2
    ).to(
      '.chennai-title',
      { opacity: 0, duration: 0.3 },
      3.2
    );

    // ── The silence. ─────────────────────────────────────────────────────
    // Nothing is scheduled between 3.65 and 4.15. The gap is the animation.

    tl.fromTo(
      '.chennai-turn',
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5, ease: EASE.out },
      4.15
    )
      .fromTo(
        '.chennai-resolution',
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.5, ease: EASE.out },
        4.55
      )
      // The mark, last, and barely.
      .fromTo('.chennai-seal', { opacity: 0 }, { opacity: 1, duration: 0.7 }, 4.9)
      .fromTo(
        '.chennai-closing',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.6, ease: EASE.out },
        5.15
      )
      // The attribution belongs to this block and was the one part of it with
      // no animation at all — so it sat at full opacity through the noise,
      // which is what "Glare" was colliding with.
      .fromTo('.chennai-attribution', { opacity: 0 }, { opacity: 1, duration: 0.5 }, 5.4);

    return () => {
      delete el.dataset.scene;
    };
  }, [pointerMotion]);

  return (
    <section
      ref={root}
      id="chennai"
      aria-label="Chennai, and what VAPR is for"
      /*
        Under the scene the section is 290svh tall: one screen for the stage,
        which sticks to the top of the window, and 190 more of scroll for the
        timeline to run through — the same travel ScrollTrigger's pin spacer
        used to add, stated in CSS where the browser can hold the stage still
        itself. It does not apply to the plain layout: with no script, or with
        reduced motion, this is a column of four words and a paragraph, and the
        stage's own `py-24` is the whole of its spacing.

        The section's top padding has gone with the pin. It was 6vh, 10vh from
        md, and under the scene it held the stage that far below the top of the
        window — which is the gap the pin was moved onto the stage to escape.
        A sticky stage has no such escape: it sticks where it is, so there is
        nothing above it.
      */
      className="on-ink group relative bg-paper data-[scene=on]:min-h-[290svh]"
      /* `data-`, not `group-data-`: the attribute is on this element, and a
         group variant looks for it on an ancestor — so the first spelling of
         this matched nothing, the section kept the stage's own height, and the
         scene had 40px of scroll to run a five-beat sequence in. */
    >
      <style>{NOISE_PLACEMENT_CSS}</style>
      <div
        ref={stage}
        className="gutter mx-auto flex max-w-6xl flex-col items-center gap-12 py-24 text-center group-data-[scene=on]:sticky group-data-[scene=on]:top-0 group-data-[scene=on]:grid group-data-[scene=on]:h-[100svh] group-data-[scene=on]:max-w-6xl group-data-[scene=on]:gap-0 group-data-[scene=on]:place-items-center group-data-[scene=on]:overflow-hidden group-data-[scene=on]:py-0"
      >
        {/*
          The ceiling was 12rem, which is a fixed 192px however wide the
          screen is — so on a 1440 display the word filled less than half the
          frame, and on anything larger it shrank as a proportion until it was
          a medium-sized word alone in an empty field. The whole movement is
          "the city, named, very large"; 16vw is the size that actually fills
          the frame, and the cap is now high enough that the vw term is the one
          doing the work at every ordinary desktop size.
        */}
        <h2 className="chennai-title type-display text-[clamp(3rem,16vw,18rem)] leading-none tracking-[-0.03em] text-ink group-data-[scene=on]:col-start-1 group-data-[scene=on]:row-start-1">
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
              <span className="type-display block text-[clamp(2rem,7vw,7rem)] leading-none text-ink group-data-[scene=on]:text-left">
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
            tone="paper"
            sizes="(min-width: 768px) 112px, 22vw"
            className="chennai-seal w-[min(22vw,7rem)]"
          />

          <p className="chennai-turn type-display mt-8 max-w-[18ch] text-[clamp(1.5rem,4vw,2.75rem)] leading-[1.15] text-ink">
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
