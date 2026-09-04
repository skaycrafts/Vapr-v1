'use client';

import { useRef } from 'react';
import Frame from '@/components/media/Frame';
import RevealText from '@/motion/primitives/RevealText';
import { SPACES } from '@/lib/content';
import { gsap } from '@/lib/gsap';
import { useMotionEffect } from '@/motion/useMotionEffect';
import { EASE, SCRUB, STAGGER } from '@/motion/config';
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
 *
 * It moved off the homepage and into each property. The six rooms are shared
 * facilities of a specific building, not a fact about the group — reading
 * about them on a page that had not yet said which hotel you were looking at
 * was the wrong place to meet them. `note` carries the disclosure for a
 * property whose own shared rooms have not been photographed yet.
 */
export default function Spaces({ note }: { note?: string } = {}) {
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

    /**
     * One unit of timeline per room, and the two layers are scheduled on
     * deliberately different rules.
     *
     * The photographs *cross*: each arrival is pulled a quarter of a unit
     * early so it is already coming up as the one in front goes, and the stage
     * is never empty. That overlap is what makes this feel like walking
     * through a building.
     *
     * The names do not cross — they cut. Type dissolving through type is not a
     * dissolve, it is two sentences printed on top of each other: for a few
     * hundred milliseconds every step neither one is readable, and on a phone,
     * where the label sits directly under the photograph rather than beside
     * it, it reads as a rendering fault.
     *
     * So the handoff is exact. The outgoing name travels up out of its mask
     * over the fifth of a unit ending at i+1, and the incoming one starts from
     * below at i+1 — no overlap, and no dead beat either, which is the other
     * way to get this wrong. Uncovered rather than faded, the same as every
     * other title on the site (§05, §06).
     */
    plates.forEach((plate, i) => {
      const label = labels[i];
      const name = label?.querySelector<HTMLElement>('[data-swap] > *');
      const rest = label ? Array.from(label.querySelectorAll<HTMLElement>('[data-fade]')) : [];

      if (i > 0) {
        tl.fromTo(plate, { opacity: 0, scale: 1.07 }, { opacity: 1, scale: 1, duration: 0.7 }, i - 0.25);

        // Begins on the exact beat the previous name finishes leaving.
        if (name) {
          tl.fromTo(
            name,
            // 130, not 112: `split-mask` bleeds 15% of the element's height
            // past the overflow box so descenders are not sheared, and a name
            // parked at 112% is still inside that bleed as a faint ghost.
            { yPercent: 130 },
            { yPercent: 0, duration: 0.42, ease: EASE.outLong },
            i
          );
        }
        if (rest.length) {
          tl.fromTo(
            rest,
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.4, stagger: STAGGER.items },
            i + 0.06
          );
        }
      }

      if (i < plates.length - 1) {
        tl.to(plate, { opacity: 0, scale: 0.985, duration: 0.7 }, i + 0.75);

        // Out through the top of the mask, landing exactly on i + 1, which is
        // where the next name starts from below.
        if (name) {
          tl.to(name, { yPercent: -130, duration: 0.2, ease: EASE.inOut }, i + 0.8);
        }
        if (rest.length) {
          tl.to(rest, { opacity: 0, y: -12, duration: 0.22 }, i + 0.76);
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
        // The pinned stage is exactly one viewport tall, so its padding is the
        // only thing holding the composition off the edges of the screen. With
        // `py-0` the title sat at y=0 — underneath the fixed navigation — and
        // the photograph ran to the last pixel at the foot. The top value
        // clears the navigation at both sizes.
        className="gutter py-20 group-data-[scene=on]:flex group-data-[scene=on]:h-[100svh] group-data-[scene=on]:flex-col group-data-[scene=on]:justify-center group-data-[scene=on]:overflow-hidden group-data-[scene=on]:pb-10 group-data-[scene=on]:pt-24 md:py-32 md:group-data-[scene=on]:pb-14 md:group-data-[scene=on]:pt-28"
      >
        <header className="flex flex-wrap items-end justify-between gap-6 border-b border-hairline pb-8 group-data-[scene=on]:border-none group-data-[scene=on]:pb-6">
          <RevealText
            as="h2"
            mode="lines"
            className="type-display text-[clamp(2rem,4.4vw,3.5rem)] text-chalk"
          >
            The rest of it
          </RevealText>
          <div className="max-w-[38ch]">
            <p className="text-mist">Six shared rooms, and what each one is for.</p>
            {/* Where the photographs are not of the building you are reading
                about, the page says so rather than letting the pictures
                imply otherwise. */}
            {note ? <p className="mt-2 text-xs text-smoke">{note}</p> : null}
          </div>
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
                <div data-fade className="flex items-baseline gap-4">
                  <span className="tabular type-label">{String(i + 1).padStart(2, '0')}</span>
                  <span className="h-px flex-1 bg-hairline" />
                </div>

                <h3
                  data-swap
                  className="split-mask mt-4 text-[clamp(1.75rem,3.6vw,2.75rem)] leading-none"
                >
                  <span className="type-display block text-chalk">{space.name}</span>
                </h3>

                <p data-fade className="mt-4 max-w-[32ch] text-mist">
                  {space.line}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
