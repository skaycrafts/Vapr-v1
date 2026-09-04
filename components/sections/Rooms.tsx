'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import Frame from '@/components/media/Frame';
import Emblem from '@/components/brand/Emblem';
import RevealText from '@/motion/primitives/RevealText';
import { LOCATIONS, STAY, type Location } from '@/lib/content';
import { gsap } from '@/lib/gsap';
import { useMotionEffect, refreshScrollTriggers } from '@/motion/useMotionEffect';
import { CONTENT, EASE, SCRUB, STAGGER } from '@/motion/config';
import { cn } from '@/lib/utils';
import type { ImageSlug } from '@/lib/media';

/**
 * The rooms, moved through sideways — and the site's one horizontal sequence.
 *
 * ── What this replaced, and why ──────────────────────────────────────────
 * The old version pinned the page and ran two panels past: Maple, then
 * Deluxe, each a photograph beside a specification table, mirrored. Both
 * panels were 80vw. Both were the same shape. Both held the same rows in the
 * same order. Moving sideways through two identical objects is not a
 * sequence, it is a table that has been rotated ninety degrees — and it spent
 * the most expensive device on the site (taking the scroll away from the
 * visitor) on something a two-column layout would have said better.
 *
 * A horizontal track earns its keep only when the panels are *different*: when
 * the rhythm of wide, narrow, tall, wide, narrow is itself the composition,
 * the way a magazine spread is composed across a gutter rather than down a
 * column. So the track now runs seven panels of five different widths —
 *
 *     intro ─ plate ────── spec ── detail ─ plate ────── spec ── detail
 *      34vw   52vw          30vw    22vw     52vw          30vw    22vw
 *
 * — and the imagery alternates between the 3:2 landscapes and the 2:3
 * portraits the shoot actually produced, rather than cropping everything to
 * one shape. The photographs and the facts alternate too, so a reader is
 * never asked to look at two tables or two pictures in a row.
 *
 * ── On the two layouts ──────────────────────────────────────────────────
 * The track only exists when the scene is running. `data-scene` is set by the
 * motion effect, which runs only when the device has agreed to motion — so a
 * visitor with scripting off, or one who asked for reduced motion, gets an
 * ordinary vertical column instead.
 *
 * That matters more than it looks: a horizontal track with no script to drive
 * it is not merely unanimated, it is unreachable. `overflow-x: clip` on the
 * body would silently swallow every panel past the first.
 *
 * Guindy has not been photographed yet, so its panels carry a disclosure.
 * That state is designed rather than empty — it should not read as a failure.
 */

/** Panel widths, as a share of the viewport. The rhythm is the point. */
const W = {
  intro: 'group-data-[scene=on]:w-[84vw] md:group-data-[scene=on]:w-[34vw]',
  plate: 'group-data-[scene=on]:w-[86vw] md:group-data-[scene=on]:w-[52vw]',
  spec: 'group-data-[scene=on]:w-[86vw] md:group-data-[scene=on]:w-[30vw]',
  detail: 'group-data-[scene=on]:w-[64vw] md:group-data-[scene=on]:w-[22vw]',
} as const;

/**
 * A panel's shared frame: full stage height, its own width. Vertical
 * placement is deliberately *not* shared — see `DROP` below.
 */
const PANEL =
  'shrink-0 group-data-[scene=on]:h-full group-data-[scene=on]:flex group-data-[scene=on]:flex-col';

/**
 * Where each panel sits in the height of the stage.
 *
 * Everything centred is a row of boxes. A spread is composed on both axes, so
 * the plate sits high, the specification centres against it, and the upright
 * hangs low — the eye moves down and back up across the sequence instead of
 * travelling in a straight line.
 */
const DROP = {
  high: 'group-data-[scene=on]:justify-center md:group-data-[scene=on]:justify-start md:group-data-[scene=on]:pt-[9vh]',
  centre: 'group-data-[scene=on]:justify-center',
  low: 'group-data-[scene=on]:justify-center md:group-data-[scene=on]:justify-end md:group-data-[scene=on]:pb-[10vh]',
} as const;

export default function Rooms() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useMotionEffect(root, ({ q }) => {
    const el = root.current;
    const rail = track.current;
    if (!el || !rail) return;

    // Switches the column into the horizontal track. Set here rather than in
    // the markup so the layout cannot engage without the timeline that makes
    // it navigable.
    el.dataset.scene = 'on';

    // Measured in a function so a resize — or a phone's address bar sliding
    // away — recomputes it rather than pinning to a width since changed.
    const distance = () => Math.max(0, rail.scrollWidth - window.innerWidth);

    const tween = gsap.to(rail, {
      x: () => -distance(),
      ease: EASE.none,
      scrollTrigger: {
        trigger: el,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: SCRUB.weighted,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    // Parallax inside a horizontal track: `containerAnimation` tells
    // ScrollTrigger to measure against the track's travel rather than the
    // page's, which is the only way this reads correctly. Kept small — the
    // panels are already moving; the image only has to lag them a little.
    q('.room-plate').forEach((plate) => {
      const img = plate.querySelector('img');
      if (!img) return;
      gsap.fromTo(
        img,
        { xPercent: -6 },
        {
          xPercent: 6,
          ease: EASE.none,
          scrollTrigger: {
            trigger: plate,
            containerAnimation: tween,
            start: 'left right',
            end: 'right left',
            scrub: SCRUB.tight,
          },
        }
      );
    });

    // The facts arrive as their panel reaches the frame, rather than all of
    // them being already on screen the moment the section pins. Same
    // `containerAnimation` trick: the trigger is the panel's horizontal
    // position, not the page's vertical one.
    q('[data-room-copy]').forEach((copy) => {
      const rows = copy.querySelectorAll('[data-row]');
      if (!rows.length) return;
      gsap.from(rows, {
        opacity: 0,
        y: 16,
        duration: CONTENT.base,
        ease: EASE.outLong,
        stagger: STAGGER.rows,
        scrollTrigger: {
          trigger: copy,
          containerAnimation: tween,
          start: 'left 88%',
          once: true,
        },
      });
    });

    // The track's width depends on imagery that may still be decoding.
    refreshScrollTriggers();

    return () => {
      delete el.dataset.scene;
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  });

  return (
    // `overflow-hidden` below is load-bearing, not tidiness. The track is
    // wider than the screen by design, and on a phone an unclipped overflow
    // widens the layout viewport itself — `innerWidth` then reports the
    // track's own width, the travel computes to `scrollWidth - innerWidth`
    // = 0, and the gallery pins without ever moving.
    <section
      ref={root}
      id="rooms"
      aria-labelledby="rooms-title"
      className="group relative overflow-hidden bg-void"
    >
      <div
        ref={track}
        className={cn(
          'flex flex-col',
          // The gutter between panels. Without it the upright detail and the
          // plate that follows it butt edge to edge and read as one torn image.
          'group-data-[scene=on]:h-[100svh] group-data-[scene=on]:flex-row group-data-[scene=on]:flex-nowrap group-data-[scene=on]:items-stretch group-data-[scene=on]:gap-4 group-data-[scene=on]:will-change-transform md:group-data-[scene=on]:gap-8'
        )}
      >
        {/* ── 01. The claim. ──────────────────────────────────────────────── */}
        <div
          className={cn(
            'gutter flex flex-col justify-end py-16',
            PANEL,
            DROP.centre,
            W.intro,
            'group-data-[scene=on]:py-24 md:group-data-[scene=on]:py-0'
          )}
        >
          <p className="type-label">The rooms</p>
          <RevealText
            as="h2"
            id="rooms-title"
            mode="lines"
            className="type-display mt-4 text-[clamp(2.25rem,5vw,4rem)] text-chalk"
          >
            One room,
            <br />
            done properly.
          </RevealText>
          <p className="mt-6 max-w-[32ch] text-mist">
            Neither hotel makes you pick between five tiers of the same bed. There is one
            category at each, and this is what is in it.
          </p>
          <p className="tabular mt-8 text-sm text-smoke">
            Check in from {STAY.checkIn} · out by {STAY.checkOut}
          </p>
        </div>

        {LOCATIONS.map((loc, i) => (
          <RoomChapter key={loc.slug} location={loc} index={i} />
        ))}
      </div>
    </section>
  );
}

/**
 * One property's three panels: the plate, the specification, and a single
 * upright detail. Kept together so the sequence cannot get out of order, and
 * so adding a third property adds three panels rather than three edits.
 */
function RoomChapter({ location, index }: { location: Location; index: number }) {
  // The shoot gave us 3:2 landscapes and 2:3 portraits. The plate takes a
  // landscape and the detail takes an upright, so the track alternates shape
  // as well as width rather than cropping everything to one ratio.
  const plate = location.images[0];
  const upright = location.images.find((slug) => UPRIGHT.has(slug));

  return (
    <>
      {/* ── The plate. ─────────────────────────────────────────────────────── */}
      <div className={cn('room-plate relative overflow-hidden', PANEL, DROP.high, W.plate)}>
        {plate ? (
          <div className="h-[46vh] w-full group-data-[scene=on]:h-[68vh] md:group-data-[scene=on]:h-[70vh]">
            <Frame
              slug={plate as ImageSlug}
              sizes="(min-width: 768px) 52vw, 86vw"
              ratio="fill"
              className="h-full w-full"
              imgClassName="scale-[1.08]"
            />
          </div>
        ) : (
          <div className="flex h-[46vh] w-full flex-col items-center justify-center gap-6 border border-hairline bg-pitch p-8 text-center group-data-[scene=on]:h-[68vh] md:group-data-[scene=on]:h-[70vh]">
            <Emblem sizes="128px" className="w-24 opacity-25 md:w-32" />
            <p className="max-w-[28ch] text-sm text-smoke">
              {location.shortName} is still being photographed. The specification is
              here, and the desk will send you pictures on request.
            </p>
          </div>
        )}
      </div>

      {/* ── The specification. ─────────────────────────────────────────────── */}
      <div
        data-room-copy
        className={cn(
          'gutter min-w-0 border-t border-hairline py-14',
          PANEL,
          DROP.centre,
          W.spec,
          'group-data-[scene=on]:border-l group-data-[scene=on]:border-t-0 group-data-[scene=on]:py-24 md:group-data-[scene=on]:py-0'
        )}
      >
        <div data-row className="flex items-baseline gap-4">
          <span className="tabular type-label">{String(index + 1).padStart(2, '0')}</span>
          <span className="h-px flex-1 bg-hairline" />
          <span className="type-label">{location.area}</span>
        </div>

        <h3
          data-row
          className="type-display mt-5 text-[clamp(2rem,4vw,3.25rem)] leading-none text-chalk"
        >
          {location.room.name}
        </h3>
        <p data-row className="mt-3 text-mist">
          at {location.name} · {location.roomCount} rooms
        </p>
        {location.imagesArePlaceholder ? (
          <p data-row className="mt-2 text-xs text-smoke">
            Photograph shows an Ashok Nagar room, finished to the same standard.
          </p>
        ) : null}

        <dl className="mt-7">
          {[
            { label: 'Bed', value: location.room.bed },
            { label: 'Sleeps', value: location.room.sleeps },
          ].map((row) => (
            <div
              key={row.label}
              data-row
              className="flex items-baseline justify-between gap-6 border-t border-hairline py-3"
            >
              <dt className="type-label">{row.label}</dt>
              <dd className="text-right text-sm text-bone">{row.value}</dd>
            </div>
          ))}
          <div data-row className="border-t border-hairline py-3">
            <dt className="type-label mb-1.5">In the room</dt>
            <dd className="text-sm leading-relaxed text-bone">
              {location.room.inclusions.join(' · ')}
            </dd>
          </div>
        </dl>

        <Link
          data-row
          href={`/${location.slug}`}
          data-cursor="Explore"
          className="mt-7 inline-flex items-center gap-2 border-b border-hairline-strong pb-1 text-sm text-chalk transition-colors duration-300 hover:border-chalk"
        >
          Everything about {location.shortName}
          <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden />
        </Link>
      </div>

      {/* ── One upright, to break the rhythm. ──────────────────────────────── */}
      {upright ? (
        <div className={cn('room-plate relative overflow-hidden', PANEL, DROP.low, W.detail)}>
          <div className="h-[52vh] w-full group-data-[scene=on]:h-[58vh] md:group-data-[scene=on]:h-[56vh]">
            <Frame
              slug={upright as ImageSlug}
              sizes="(min-width: 768px) 22vw, 64vw"
              ratio="fill"
              className="h-full w-full"
              imgClassName="scale-[1.08]"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

/**
 * The 2:3 frames in the manifest. Listed rather than derived because the
 * decision is editorial — these are the ones shot upright and worth standing
 * a panel on — not simply "whatever happens to be taller than it is wide".
 */
const UPRIGHT = new Set([
  'room-twin',
  'room-pillows',
  'room-headboard',
  'room-lounge',
  'detail-curtain',
]);
