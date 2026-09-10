'use client';

import { useRef } from 'react';
import Emblem from '@/components/brand/Emblem';
import { HERO, SITE } from '@/lib/content';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useMotionEffect, refreshScrollTriggers } from '@/motion/useMotionEffect';
import { useScroll } from '@/motion/ScrollProvider';
import { ENTRY, useEntry } from '@/motion/entry';
import { useCapability } from '@/motion/capability';
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
 * The reveal clip, and how it is made to sit exactly on top of the emblem.
 *
 * `scripts/build-brand.mjs` re-frames the supplied animation into an 852x852
 * square about the mark's own centre, and in the resolved frame the emblem
 * measures 676x679 across that box — 79.5%. The static `Emblem` fills its box
 * edge to edge, because the artwork is trimmed to its ink. So for the clip's
 * last frame to land ON the emblem rather than near it, the clip is drawn at
 * 1/0.79519 of the mark's width and pulled back by half the difference on
 * both axes.
 *
 * The fraction is the mean of the two axes: the clip's emblem is 0.4% taller
 * than it is wide, so splitting the difference leaves either axis out by half
 * of that rather than one of them out by all of it. At the size this renders,
 * that is well under a pixel.
 *
 * Deriving these from the measurement rather than typing 126% is the point:
 * re-frame the clip and this is the line to change.
 */
const EMBLEM_IN_CLIP = 0.79519;
const CLIP_BOX = 100 / EMBLEM_IN_CLIP;
const CLIP_INSET = (CLIP_BOX - 100) / 2;

/** The built clip runs 8.0s. The guard is that, with room for a slow start. */
const REVEAL_GUARD_MS = 11_500;
/**
 * How long the clip gets to produce its first frame before the mark gives up
 * and shows the artwork.
 *
 * This is the one that catches a broken file. `error` does not fire on a
 * <video> whose <source> children fail — it fires on the last <source>, and
 * the element itself just goes quiet with NETWORK_NO_SOURCE. Waiting on the
 * end-of-clip guard for that meant eleven seconds of an empty frame. Watching
 * for the first `playing` instead covers a 404, a codec the device cannot
 * decode, and a connection too slow to be worth waiting on, with one rule.
 */
const REVEAL_START_MS = 3_000;
/** Long enough to read as a settle rather than a swap. */
const REVEAL_SETTLE = 0.9;

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const { started } = useEntry();
  const { scrollTo } = useScroll();
  const { animate } = useCapability();

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
    ({ q }) => {
      const el = root.current;
      if (!el || !started) return;

      gsap.from('.hero-mark', {
        opacity: 0,
        scale: 0.94,
        duration: CINEMA.epic,
        ease: EASE.outLong,
        delay: Math.max(0, ENTRY.headline - ENTRY.lift),
      });

      gsap.to('.hero-mark', {
        yPercent: 10,
        ease: EASE.none,
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: SCRUB.tight },
      });

      const [clip] = q('.hero-reveal') as HTMLVideoElement[];
      const [emblem] = q('.hero-emblem');
      if (!clip || !emblem) return;

      // Hand the box to the clip. Safe to do here rather than at mount: the
      // `from` above is already holding the whole mark at opacity 0, so
      // nothing on screen changes on this frame. The markup default is the
      // other way round, which is what reduced motion and a dead script get.
      gsap.set(emblem, { opacity: 0 });
      gsap.set(clip, { opacity: 1 });

      let settled = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        clip.pause();
        gsap
          .timeline({ defaults: { duration: REVEAL_SETTLE, ease: EASE.outLong } })
          .to(emblem, { opacity: 1 }, 0)
          .to(clip, { opacity: 0 }, 0);
      };

      clip.addEventListener('ended', settle);
      clip.addEventListener('error', settle);

      // A tab backgrounded mid-clip can throttle to the point where `ended`
      // arrives minutes late, or not at all. The mark must not wait on it.
      const guard = window.setTimeout(settle, REVEAL_GUARD_MS);

      // And nothing at all may be coming. Cancelled the moment a frame lands.
      let startGuard = window.setTimeout(settle, REVEAL_START_MS);
      const onPlaying = () => {
        window.clearTimeout(startGuard);
        startGuard = 0;
      };
      clip.addEventListener('playing', onPlaying, { once: true });

      // Past the fold the clip is decoding frames nobody is looking at, and
      // coming back to a half-drawn emblem would read as a fault rather than
      // as an entrance. It is an arrival; it does not get a second showing.
      const leave = ScrollTrigger.create({ trigger: el, start: 'bottom top', onEnter: settle });

      // A rejected promise here is the autoplay policy, which is a normal
      // answer on a metered or battery-saving device — not an error.
      void clip.play().catch(settle);

      return () => {
        clip.removeEventListener('ended', settle);
        clip.removeEventListener('error', settle);
        clip.removeEventListener('playing', onPlaying);
        window.clearTimeout(guard);
        window.clearTimeout(startGuard);
        leave.kill();
      };
    },
    [started]
  );

  /**
   * Depart. The frame dims and the copy drifts up as the next section takes
   * over, so the two overlap rather than butting against each other (§19).
   */
  useMotionEffect(root, () => {
    const el = root.current;
    if (!el) return;

    gsap.to('.hero-copy', {
      yPercent: -32,
      opacity: 0,
      ease: EASE.none,
      scrollTrigger: { trigger: el, start: 'top top', end: '70% top', scrub: SCRUB.tight },
    });

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
      className="on-ink relative h-[100svh] min-h-[34rem] w-full overflow-hidden bg-paper"
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
      <div className="pointer-events-none absolute inset-x-0 top-[9svh] flex h-[50svh] items-center justify-center md:top-[10svh] md:h-[46svh]">
        <div className="hero-mark relative aspect-square w-[min(62vw,23.75rem,calc(1.0496*max(100svh,34rem)-330px))] md:w-[min(62vw,23.75rem,calc(1.0656*max(100svh,34rem)-389px))]">
          {/* The white cut of the artwork. This section kept the black
              ground, and the black cut would be a hole in it. */}
          <Emblem
            priority
            tone="paper"
            sizes="(min-width: 768px) 380px, 62vw"
            className="hero-emblem absolute inset-0"
          />

          {/*
            The clip sits over the emblem and larger than it, because its own
            frame carries space around the mark that the trimmed artwork does
            not. Both are centred on the same point, so the last frame lands on
            the still rather than beside it.

            No blend mode, and this is the reason the hero kept the black.

            The clip is white line art on #000, and this section's ground
            resolves to rgb(2,2,2) — two levels apart, below the threshold of
            a display and well below the clip's own compression noise. So the
            square it occupies simply is not visible.

            On paper it was. Measured, the same square read 255,255,255
            against a 250,250,249 page: five levels, and plainly there. The
            fix needed the clip negated to black-on-white and composited with
            `mix-blend-mode: multiply`, plus a rectangle of paper painted
            behind it — because `mix-blend-mode` only sees backdrop painted
            inside the nearest stacking context, and `.hero-mark` is one: it
            carries a GSAP transform and an opacity for the entrance and the
            parallax, so the clip had nothing to blend against and composited
            as-is.

            All of that worked and none of it is here, because keeping the
            ground the clip was cut for costs nothing and needs none of it.

            `preload` is gated on capability so a visitor who asked for
            reduced motion — who will never see a frame of this — does not
            spend three quarters of a megabyte finding that out.
          */}
          <video
            className="hero-reveal absolute aspect-square max-w-none"
            style={{
              width: `${CLIP_BOX}%`,
              left: `${-CLIP_INSET}%`,
              top: `${-CLIP_INSET}%`,
              opacity: 0,
            }}
            muted
            playsInline
            preload={animate ? 'auto' : 'none'}
            aria-hidden
            tabIndex={-1}
            disablePictureInPicture
          >
            <source src="/brand/vapr-logo-reveal.webm" type="video/webm" />
            <source src="/brand/vapr-logo-reveal.mp4" type="video/mp4" />
          </video>
        </div>
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
