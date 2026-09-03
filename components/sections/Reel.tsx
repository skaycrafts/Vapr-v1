'use client';

import { useEffect, useRef } from 'react';
import RevealImage from '@/motion/primitives/RevealImage';
import RevealText from '@/motion/primitives/RevealText';
import { video, VIDEOS, type VideoSlug } from '@/lib/media';
import { gsap } from '@/lib/gsap';
import { useMotionEffect } from '@/motion/useMotionEffect';
import { EASE, SCRUB } from '@/motion/config';

const CLIPS: { slug: VideoSlug; caption: string }[] = [
  { slug: 'reel-morning', caption: 'Before you arrive' },
  { slug: 'reel-tea', caption: 'The desk, then the tray' },
  { slug: 'reel-common', caption: 'The long table, most evenings' },
];

/**
 * The footage was shot vertically on a phone, so it is presented vertically
 * rather than cropped into a widescreen band it was never framed for. The
 * three columns rise at slightly different rates as the section passes.
 *
 * Playback is tied to visibility: off screen, nothing decodes.
 */
export default function Reel() {
  const root = useRef<HTMLElement>(null);
  const players = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const nodes = players.current.filter(Boolean) as HTMLVideoElement[];
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            // Autoplay can still be refused; the poster stays in that case.
            el.play().catch(() => {});
          } else {
            el.pause();
          }
        }
      },
      { rootMargin: '15% 0px', threshold: 0.1 }
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  useMotionEffect(root, ({ q }) => {
    const el = root.current;
    if (!el) return;

    // The middle column travels further, and the other way, so the three
    // clips read as separate planes rather than one moving block.
    q('.reel-column').forEach((column, i) => {
      gsap.fromTo(
        column,
        { yPercent: i === 1 ? 10 : 0 },
        {
          yPercent: i === 1 ? -10 : -4,
          ease: EASE.none,
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: SCRUB.loose,
          },
        }
      );
    });
  });

  return (
    <section
      ref={root}
      aria-labelledby="reel-title"
      className="gutter relative overflow-hidden bg-void py-20 md:py-28"
    >
      {/*
        This section used to carry its title only in an `aria-label`, so a
        sighted visitor met three unexplained clips arriving out of nowhere
        between the shared rooms and the specification. The name already
        existed — it just was not on the page.
      */}
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-8 md:mb-14">
        <RevealText
          as="h2"
          id="reel-title"
          mode="lines"
          className="type-display text-[clamp(2rem,4.4vw,3.5rem)] text-chalk"
        >
          The hotel in use
        </RevealText>
        <p className="type-label">Shot on a phone, on ordinary days</p>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-4 md:gap-6">
        {CLIPS.map((clip, i) => {
          const meta = video(clip.slug);
          return (
            <figure
              key={clip.slug}
              className={i === 1 ? 'reel-column sm:mt-[clamp(2rem,6vw,5rem)]' : 'reel-column'}
            >
              {/* Every other photograph on the site is uncovered by a mask;
                  the footage was the one thing that simply appeared. `curtain`
                  is the default of the four, and pairs with the caption
                  rising beneath it (§10). */}
              <RevealImage style="curtain" delay={i * 0.08} scaleFrom={1.06}>
                <div data-reveal-inner className="relative overflow-hidden bg-pitch">
                  <video
                    ref={(node) => {
                      players.current[i] = node;
                    }}
                    className="h-full w-full object-cover"
                    width={meta.width}
                    height={meta.height}
                    poster={meta.poster}
                    muted
                    loop
                    playsInline
                    preload="none"
                    aria-label={VIDEOS[clip.slug].alt}
                    style={{ aspectRatio: meta.aspect }}
                  >
                    <source src={meta.mp4} type="video/mp4" />
                  </video>
                </div>
              </RevealImage>
              <figcaption className="type-label mt-4">{clip.caption}</figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
