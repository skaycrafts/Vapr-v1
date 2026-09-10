'use client';

import { useEffect, useRef } from 'react';
import DepthText from '@/components/brand/DepthText';
import { HERO, SITE } from '@/lib/content';
import { gsap } from '@/lib/gsap';
import { useMotionEffect, refreshScrollTriggers } from '@/motion/useMotionEffect';
import { useScroll } from '@/motion/ScrollProvider';
import { ENTRY, useEntry } from '@/motion/entry';
import { CINEMA, CONTENT, EASE, SCRUB } from '@/motion/config';

const LINES = HERO.statement.split('\n');

/**
 * Set one word of a line in the script face and leave the rest alone.
 *
 * Splits on the first occurrence and falls back to the plain string when the
 * word is not in the line — so `HERO.accent` can be changed or emptied in
 * content without this file knowing, and a mismatch costs the accent rather
 * than the headline.
 */
function accented(line: string, accent: string) {
  const at = accent ? line.indexOf(accent) : -1;
  if (at < 0) return line;
  return (
    <>
      {line.slice(0, at)}
      <span className="script">{accent}</span>
      {line.slice(at + accent.length)}
    </>
  );
}

/**
 * The word, where the seal used to be.
 *
 * The hero carried the emblem itself: the supplied reveal animation drawing
 * the mark on, dissolving into the Lanczos-resampled still, both centred in a
 * square slot with the clip sized to land its last frame exactly on the
 * artwork. All of that has gone, and with it every constant that positioned
 * it and every guard that made sure the still appeared when the clip did not.
 *
 * The mark has not left the site — the bar carries it, greyed, over the dark
 * sections. `public/brand/vapr-logo-reveal.{mp4,webm}` and the `buildReveal`
 * step that makes them are now unreferenced; they are left in place rather
 * than deleted, because nothing else regenerates them and this is one line of
 * JSX away from coming back.
 */

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const { started } = useEntry();
  const { scrollTo } = useScroll();

  /**
   * Take the hero out of the paint once it is covered.
   *
   * `sticky top-0 z-0` is what lets the page climb over it, and it keeps the
   * hero laid out at the top of the viewport for the whole of `main`. That is
   * fine while everything above it is opaque — and everything above it is not.
   * `Chapter` fades a departing section to 0.3, which turned each of those
   * sections into a window onto a hero that was still sitting there: VAPR
   * ghosting through the addresses, the headline surfacing in the middle of
   * the enquiry.
   *
   * So it is hidden the moment it can no longer be seen honestly. At a scroll
   * of exactly one hero height the next section's top edge is level with the
   * top of the viewport and the cover is complete, so flipping `visibility`
   * there changes nothing on screen and removes it from every composite after.
   *
   * Not a `useMotionEffect`: a reduced-motion visitor gets the sticky hero and
   * the translucent chapters too, so this has to run for them as well. And not
   * a ScrollTrigger — its offsets are measured from an element's place in the
   * document, which for a sticky element is not where it is painted.
   */
  useEffect(() => {
    const el = root.current;
    if (!el) return;

    const onScroll = () => {
      el.style.visibility = window.scrollY >= el.offsetHeight ? 'hidden' : 'visible';
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  /**
   * Entry. Scheduled against the moment the overture's field begins to lift,
   * so the headline is already rising while the black is still travelling —
   * the two read as one movement rather than a handover (§03).
   */
  useMotionEffect(
    root,
    () => {
      if (!started) return;

      // Offsets are relative to `lift`, which is when `started` fires.
      const at = (mark: number) => Math.max(0, mark - ENTRY.lift);

      const tl = gsap.timeline({ defaults: { ease: EASE.outLong } });

      tl
        // The city, first and smallest. The seal has just said VAPR; this
        // says where, before anything says what.
        .from('.hero-place', { opacity: 0, duration: CONTENT.slow }, at(ENTRY.headline) - 0.22)
        .from(
          '.hero-rule',
          { scaleX: 0, duration: CINEMA.base, ease: EASE.inOutHeavy },
          at(ENTRY.headline) - 0.1
        )
        // The two halves of the sentence arrive as two beats, not as one
        // staggered pair. `STAGGER.lines` is 0.08s — fast enough that the
        // reader sees a single block settle. A fifth of a second apart is
        // long enough to read as "a quiet floor" … "above a loud street",
        // which is the whole joke of the line and was being thrown away.
        .from('.hero-line-1 > span', { yPercent: 118, duration: CINEMA.fast }, at(ENTRY.headline))
        .from(
          '.hero-line-2 > span',
          { yPercent: 118, duration: CINEMA.fast },
          at(ENTRY.headline) + 0.2
        )
        .from('.hero-cue', { opacity: 0, duration: 0.8 }, at(ENTRY.cue));

      // The hero is the first pinned measurement on the page; remeasure once
      // the entrance has released the scroll and heights are final.
      refreshScrollTriggers();
    },
    [started]
  );

  /**
   * The mark settles out of a hair under full size as the entrance hands over,
   * and then drifts a little against the scroll — the same treatment the
   * photograph used to get, applied to the thing that replaced it.
   *
   * ── The reveal, and why it hands back to the still artwork ──────────────
   * Two things occupy the mark's box: the supplied reveal animation, and the
   * emblem itself. The clip plays once, then dissolves into the still.
   *
   * The still gets the last word for two smaller reasons than it once did.
   * The clip draws the real mark — measured against the artwork it is a near
   * match, every rule, rosette and fan where the logo puts them — but it is
   * h264 line art, and it resolves to a grey some way short of the chalk the
   * rest of the page is set in. `Emblem` is Lanczos-resampled from the 2157px
   * master and is the same white as the type. So the clip does the arriving
   * and the artwork does the staying, at a size and centre measured to match,
   * and the handover reads as the mark coming into focus.
   *
   * Every path out of the clip ends in the same place. It finishes; or the
   * browser refuses to autoplay it; or the file is missing, undecodable, or
   * simply too slow to be worth waiting on; or the visitor scrolls past
   * before it is done; or `useMotionEffect` never runs it at all because the
   * visitor asked for reduced motion. In every one the artwork is what is on
   * screen, and `settle` is idempotent so they may race — which they do, a
   * failed load firing both the start watchdog and `play()`'s rejection.
   */
  useMotionEffect(
    root,
    () => {
      if (!started) return;

      gsap.from('.hero-mark', {
        opacity: 0,
        scale: 0.94,
        duration: CINEMA.epic,
        ease: EASE.outLong,
        delay: Math.max(0, ENTRY.headline - ENTRY.lift),
      });

    },
    [started]
  );

  /**
   * Depart — except it does not any more. It is covered.
   *
   * The hero used to drift its copy up and fade it out as the next section
   * arrived, and the mark drifted against the scroll on top of that. Both are
   * gone. The hero is `sticky` now and the page rides up over it, so the
   * frame holds perfectly still and a hard edge crosses it — which is the
   * whole of the effect and is spoiled by anything underneath it moving. Two
   * things leaving at once reads as a glitch rather than as a transition.
   *
   * What is left is the cue's rail, which is not a departure: it fills as the
   * first viewport is consumed and then retires.
   */
  useMotionEffect(root, () => {
    const el = root.current;
    if (!el) return;

    // The indicator fills as the first viewport is consumed, then retires. It
    // never becomes a permanent progress bar across the page (§23).
    gsap.to('.hero-cue-fill', {
      scaleY: 1,
      ease: EASE.none,
      scrollTrigger: { trigger: el, start: 'top top', end: '55% top', scrub: SCRUB.tight },
    });
  });

  return (
    <section
      ref={root}
      id="top"
      className="on-ink sticky top-0 z-0 h-[100svh] min-h-[34rem] w-full overflow-hidden bg-paper"
    >
      {/*
        The mark, where the building used to be.

        The hero was a full-bleed photograph of the Ashok Nagar facade with a
        WebGL layer dissolving between three stills on top of it. Both are
        gone: the opening is typographic now, and the emblem is the only thing
        in the upper two-thirds of the frame.

        It sits above the copy rather than behind it — no scrim, because there
        is nothing to scrim. The type is on plain void and reads at the same
        contrast as the rest of the site.

        Placed a little above centre in the space left over the copy block, so
        the composition is weighted the way the page reads: mark, rule,
        sentence, addresses.
      */}
      {/*
        ── Why the mark is capped against viewport height ───────────────────
        The slot below was sized for the emblem. The reveal clip is 1.257x the
        emblem — its own frame carries the sweep that draws the ring, which is
        wider and a good deal taller than the mark it resolves into — so the
        clip hangs about 49px past the slot at full size and, on a short
        window, reached down through the rule and across the copy.

        The third term in the width closes that. It is the largest mark whose
        clip still clears the rule, solved from the layout: the mark's centre
        sits at 33svh (34svh before md), the clip's half-height is 0.629 of the
        mark's width, and the rule sits about 229px above the foot of the frame
        on desktop and 193px on mobile — leaving a 16px gap on top. Measured
        against `max(100svh, 34rem)` rather than the viewport alone because
        that is the section's real height once `min-h` takes over.

        It binds only when the window is genuinely short: above about 750px of
        viewport height the 23.75rem cap still wins and nothing moves.
      */}
      {/*
        VAPR, extruded.

        The width cap that used to be here solved a problem that left with the
        clip: the clip's frame was 1.257x the mark and hung past the slot into
        the rule below. Type has no such overhang, so the size is just a clamp
        — and `nowrap` on the layers means it must never be allowed to reach
        the gutter, hence the vw term rather than a fixed ceiling.

        `tilt` is 5 against the component's default 7.5, and the orbit is
        slower. At the demo's settings a four-letter word at this size swings
        far enough to read as a toy; the point here is that the letters have
        depth, not that they are moving.
      */}
      <div className="pointer-events-none absolute inset-x-0 top-[9svh] flex h-[50svh] items-center justify-center md:top-[10svh] md:h-[46svh]">
        <DepthText
          className="hero-mark"
          text={SITE.name}
          layers={30}
          depth={2.2}
          tilt={5}
          smoothing={0.12}
          perspective={1100}
          orbitSpeed={0.22}
          fontSize="clamp(4rem, 17vw, 11rem)"
          fontWeight={400}
          letterSpacing="0.005em"
        />
      </div>

      <div className="hero-copy gutter absolute inset-x-0 bottom-0 pb-9 md:pb-12">
        <p className="hero-place type-label mb-4 text-ink/80">{SITE.city}</p>

        <div className="hero-rule mb-4 h-px w-full origin-left bg-hairline-strong md:mb-5" />

        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:gap-16">
          {/*
            One sentence, one accent.

            This used to set the whole second line in Bodoni's italic — roman
            states the fact, italic answers it. That was the right device when
            there were two faces. There are three now, and the script carrying
            "quiet" in the line above was competing with it: two different
            emphases stacked, the script's swashes tangling with the italic
            underneath, and a reader with no idea which of the two was the
            point.

            So the second line is roman and the script is the only emphasis in
            the frame — which is what the reference boards actually do. "Old"
            against "Money", one word, everything else plain. Both halves still
            rise out of their own clipping mask a fifth of a second apart, so
            the line arrives the way it reads.
          */}
          <h1 className="type-display max-w-[16ch] text-[clamp(2.25rem,6.4vw,5.25rem)] text-ink">
            <span className="hero-line-1 split-mask">
              <span className="block" style={{ willChange: 'transform' }}>
                {accented(LINES[0], HERO.accent)}
              </span>
            </span>
            <span className="hero-line-2 split-mask">
              <span className="block">{LINES[1]}</span>
            </span>
          </h1>

          {/* The two addresses used to sit above this, as an eyebrow and a
              line of areas. They have gone: the hero already names the city
              over the rule, and the section directly beneath it is the
              property chooser, which says both names at the size they deserve.
              Saying them here as well made the frame's one quiet corner into a
              second caption. */}
          <div className="flex shrink-0 items-end justify-end">
            <a
              href="#chennai"
              className="hero-cue group flex items-center gap-3 text-mist transition-colors duration-300 hover:text-ink"
              onClick={(e) => {
                e.preventDefault();
                scrollTo('#chennai');
              }}
            >
              <span className="type-label text-inherit">{HERO.scrollCue}</span>
              {/* A rail that fills as the hero is consumed, rather than a
                  looping arrow that keeps asking after you have answered. */}
              <span aria-hidden className="relative block h-10 w-px overflow-hidden bg-hairline">
                {/*
                  Tailwind's `scale-*` utilities compile to the standalone CSS
                  `scale` property in v4, which multiplies against `transform`
                  rather than replacing it. GSAP animates `transform`, so a
                  `scale-y-0` class here pinned the rendered size at zero
                  forever: this rail has never actually filled. The rest state
                  is an inline transform now, on the same property GSAP drives.
                */}
                <span
                  className="hero-cue-fill absolute inset-x-0 top-0 h-full origin-top bg-ink"
                  style={{ transform: 'scaleY(0)' }}
                />
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
