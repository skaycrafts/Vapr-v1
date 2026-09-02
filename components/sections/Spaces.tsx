'use client';

import { useRef } from 'react';
import Frame from '@/components/media/Frame';
import { SPACES } from '@/lib/content';
import { gsap } from '@/lib/gsap';
import { useMotionEffect } from '@/motion/useMotionEffect';
import { EASE, SCRUB } from '@/motion/config';
import type { ImageSlug } from '@/lib/media';

/**
 * Six shared rooms, one at a time, moved through rather than browsed.
 *
 * The section pins and the scroll walks the sequence. The important detail is
 * the overlap: each photograph starts arriving a beat *before* the one in
 * front of it has gone, so there is never a frame of empty stage between two
 * rooms. That continuity is the difference between walking through a building
 * and clicking through a gallery (§15).
 *
 * The number and the name change on the same beat as the image, so the label
 * always belongs to what is on screen — a caption that lags its photograph by
 * even a couple of hundred milliseconds reads as a bug.
 *
 * Without motion this is a plain list: every photograph in document order with
 * its name and its sentence beneath. The pinned composition is applied by the
 * effect, so a visitor who never gets the timeline never gets a stack of six
 * images piled on one another either.
 */
export default function Spaces() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useMotionEffect(root, ({ q }) => {
    const el = root.current;
    const scene = stage.current;
    if (!el || !scene) return;

    el.dataset.scene = 'on';

    const plates = q('.space-plate');
    const labels = q('.space-label');
    if (!plates.length) return;

    const tl = gsap.timeline({
      defaults: { ease: EASE.out },
      scrollTrigger: {
        trigger: el,
        start: 'top top',
        // Enough that each room is genuinely looked at, short enough that six
        // of them do not become a corridor the visitor has to escape from.
        //
        // Shorter on a phone: the same 55% costs 4.3 screens of scrolling on
        // a 812px viewport, and a thumb pays for that in a way a wheel does
        // not. Read at refresh, so rotating the device recomputes it.
        end: () => `+=${plates.length * (window.innerWidth < 768 ? 38 : 55)}%`,
        pin: scene,
        anticipatePin: 1,
        scrub: SCRUB.weighted,
        invalidateOnRefresh: true,
      },
    });

    plates.forEach((plate, i) => {
      const label = labels[i];
      // One unit of timeline per room, with each arrival pulled a quarter of a
      // unit early so it crosses the outgoing one.
      const enter = i - 0.25;

      if (i > 0) {
        tl.fromTo(
          plate,
          { opacity: 0, scale: 1.07 },
          { opacity: 1, scale: 1, duration: 0.7 },
          enter
        );
        if (label) {
          tl.fromTo(
            label,
            { opacity: 0, yPercent: 40 },
            { opacity: 1, yPercent: 0, duration: 0.6 },
            enter + 0.05
          );
        }
      }

      // Everything except the last room leaves as its successor arrives.
      if (i < plates.length - 1) {
        const leave = i + 1 - 0.25;
        tl.to(plate, { opacity: 0, scale: 0.985, duration: 0.7 }, leave);
        if (label) {
          tl.to(label, { opacity: 0, yPercent: -35, duration: 0.55 }, leave);
        }
      }
    });

    return () => {
      delete el.dataset.scene;
    };
  });

  return (
    <section
      ref={root}
      id="spaces"
      aria-label="The shared rooms"
      className="group relative bg-void"
    >
      <div
        ref={stage}
        className="gutter py-20 group-data-[scene=on]:flex group-data-[scene=on]:h-[100svh] group-data-[scene=on]:flex-col group-data-[scene=on]:justify-center group-data-[scene=on]:overflow-hidden group-data-[scene=on]:py-0 md:py-32"
      >
        <header className="flex flex-wrap items-end justify-between gap-6 border-b border-hairline pb-8 group-data-[scene=on]:border-none group-data-[scene=on]:pb-6">
          <h2 className="type-display text-[clamp(2rem,4.4vw,3.5rem)] text-chalk">
            The rest of it
          </h2>
          <p className="max-w-[34ch] text-mist">Six shared rooms, and what each one is for.</p>
        </header>

        {/*
          In flow: an ordinary list. Once the scene engages the list becomes a
          single stage and the items stack on top of each other.
        */}
        <ol className="group-data-[scene=on]:relative group-data-[scene=on]:mt-8 group-data-[scene=on]:min-h-0 group-data-[scene=on]:flex-1">
          {SPACES.map((space, i) => (
            <li
              key={space.id}
              className="mt-12 first:mt-0 group-data-[scene=on]:absolute group-data-[scene=on]:inset-0 group-data-[scene=on]:mt-0 group-data-[scene=on]:grid group-data-[scene=on]:grid-cols-1 group-data-[scene=on]:items-center group-data-[scene=on]:gap-8 md:group-data-[scene=on]:grid-cols-12 md:group-data-[scene=on]:gap-12"
            >
              <div className="space-plate group-data-[scene=on]:h-full group-data-[scene=on]:min-h-0 md:group-data-[scene=on]:col-span-7">
                <Frame
                  slug={space.image as ImageSlug}
                  sizes="(min-width: 768px) 58vw, 100vw"
                  ratio={16 / 10}
                  className="h-full w-full"
                />
              </div>

              <div className="space-label mt-5 group-data-[scene=on]:mt-0 md:group-data-[scene=on]:col-span-5">
                <div className="flex items-baseline gap-4">
                  <span className="tabular type-label">{String(i + 1).padStart(2, '0')}</span>
                  <span className="h-px flex-1 bg-hairline" />
                </div>

                <h3 className="type-display mt-4 text-[clamp(1.75rem,3.6vw,2.75rem)] leading-none text-chalk">
                  {space.name}
                </h3>

                <p className="mt-4 max-w-[32ch] text-mist">{space.line}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
