'use client';

import { useEffect, useRef } from 'react';
import { video, VIDEOS, type VideoSlug } from '@/lib/media';
import { gsap, useIsoLayoutEffect } from '@/lib/gsap';

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

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.reel-column').forEach((column, i) => {
        gsap.fromTo(
          column,
          { yPercent: i === 1 ? 10 : 0 },
          {
            yPercent: i === 1 ? -10 : -4,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 },
          }
        );
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      aria-label="The hotel in use"
      className="gutter relative overflow-hidden bg-void py-20 md:py-28"
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-4 md:gap-6">
        {CLIPS.map((clip, i) => {
          const meta = video(clip.slug);
          return (
            <figure
              key={clip.slug}
              className={i === 1 ? 'reel-column sm:mt-[clamp(2rem,6vw,5rem)]' : 'reel-column'}
            >
              <div className="relative overflow-hidden bg-pitch">
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
              <figcaption className="type-label mt-4">{clip.caption}</figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
