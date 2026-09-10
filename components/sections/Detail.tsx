'use client';

import { useRef } from 'react';
import { Check } from 'lucide-react';
import Glass from '@/components/ui/Glass';
import RevealText from '@/motion/primitives/RevealText';
import { DETAIL, LOCATIONS, STAY } from '@/lib/content';
import { cn } from '@/lib/utils';
import { gsap } from '@/lib/gsap';
import { useMotionEffect } from '@/motion/useMotionEffect';
import { CONTENT, EASE, STAGGER } from '@/motion/config';
import DriftWall, { type DriftItem } from '@/components/media/DriftWall';

/**
 * The wall between the specification and the enquiry.
 *
 * Twenty photographs rather than the four the horizontal strip carried. A
 * drifting wall reads as a wall — the eye takes the texture of the place, not
 * four particular objects — and four frames cycling across five columns would
 * have been visibly the same picture three times per screen.
 *
 * Ordered so neighbours differ: a detail, then a room, then a threshold, then
 * a public space, and around again. The columns are dealt round robin, so
 * consecutive entries land in different columns and no column ends up being
 * the brass-and-door-furniture column.
 */
const WALL: DriftItem[] = [
  { slug: 'detail-number' },
  { slug: 'room-pillows' },
  { slug: 'lift-stone' },
  { slug: 'reception-desk' },
  { slug: 'detail-switch' },
  { slug: 'room-headboard' },
  { slug: 'stair-flight' },
  { slug: 'dining-counter' },
  { slug: 'detail-latch' },
  { slug: 'room-twin' },
  { slug: 'corridor-door' },
  { slug: 'breakfast-plate' },
  { slug: 'detail-lock' },
  { slug: 'room-lounge' },
  { slug: 'stair-palm' },
  { slug: 'common-area' },
  { slug: 'detail-books' },
  { slug: 'room-a-window' },
  { slug: 'parking-bay' },
  { slug: 'detail-curtain' },
];

/**
 * What is true of both properties, and where they differ. Set as a
 * specification sheet rather than a grid of icons: a guest scanning for one
 * item finds it in a single pass.
 *
 * The "not here" column is deliberate. Both listings state that laundry, a
 * pool and a gym are unavailable, and saying so plainly is worth more than
 * letting someone discover it at check-in.
 */
/**
 * The one section that appears on three pages, so it is the one that has to
 * be told which ground it is on: the homepage runs Reel (paper) → Detail →
 * Reserve (paper), and a property page runs Spaces (ink) → Detail →
 * GettingThere (ink). The same constant in both places would double a black
 * on one and a white on the other.
 */
export default function Detail({ tone = 'ink' }: { tone?: 'ink' | 'paper' }) {
  const root = useRef<HTMLElement>(null);

  useMotionEffect(root, () => {
    // A specification sheet: the rows should arrive quickly and get out of
    // the way. This is the one section where reading speed beats
    // choreography, so the stagger is the tightest on the site.
    gsap.from('.detail-row', {
      opacity: 0,
      y: 12,
      duration: CONTENT.base,
      ease: EASE.outLong,
      stagger: STAGGER.rows,
      scrollTrigger: { trigger: '.detail-sheet', start: 'top 78%', once: true },
    });

  });

  return (
    <section
      ref={root}
      id="detail"
      className={cn('relative overflow-hidden bg-paper py-20 md:py-28', tone === 'ink' && 'on-ink')}
    >
      <div className="gutter">
        <header className="flex flex-col gap-6 border-b border-hairline pb-9 md:flex-row md:items-end md:justify-between">
          {/* A major section title, so it gets the line reveal rather than a
              fade — the type is uncovered by its own mask (§06). */}
          <RevealText
            as="h2"
            mode="lines"
            className="type-display max-w-[16ch] text-[clamp(2rem,4.4vw,3.5rem)] text-ink"
          >
            {DETAIL.title}
          </RevealText>
          <p className="max-w-[40ch] text-mist">{DETAIL.intro}</p>
        </header>

        {/*
          Three panes: what both hotels give you, and then each property's own
          list.

          ── On the glass ────────────────────────────────────────────────────
          These are `<Glass>` again. I had taken it off on the grounds that
          refraction over a flat black ground has nothing to bend, so what
          survives is the material dressing — the tint, the rim highlight, the
          cast shadow — and not the optics the component exists for. That is
          still true, and it is a preference rather than a defect: the dressing
          is what reads as a panel here, and the panel is what was asked for.

          The one thing worth knowing is that this is where the effect is
          cheapest to lose. If these ever want the real bend, the section needs
          something behind them to bend — the reserve panel gets it from the
          photograph it floats over.

          ── On what is missing ──────────────────────────────────────────────
          There used to be a fourth pane, "Not here, at either", listing the
          laundry, the pool and the gym. It has gone. The early check-in note
          that lived at the foot of it has gone with it, but not from the site:
          both property pages still carry it under their own check-in times.
        */}
        <div className="detail-sheet grid gap-3 pt-10 sm:grid-cols-2 md:pt-14 xl:grid-cols-3">
          <Glass className="rounded-2xl p-6 md:p-7" radius={16} scale={-58}>
            <h3 className="type-label mb-4">Included at both</h3>
            <ul>
              {STAY.included.map((item) => (
                <li
                  key={item}
                  className="detail-row flex items-baseline gap-3 border-t border-hairline py-3 first:border-t-0 first:pt-0"
                >
                  <Check
                    size={14}
                    strokeWidth={1.75}
                    aria-hidden
                    className="shrink-0 translate-y-0.5 text-ink"
                  />
                  <span className="text-sm text-bone">{item}</span>
                </li>
              ))}
            </ul>
          </Glass>

          {LOCATIONS.map((loc) => (
            <Glass key={loc.slug} className="rounded-2xl p-6 md:p-7" radius={16} scale={-58}>
              <h3 className="type-label mb-4">{loc.shortName}</h3>
              <ul>
                {loc.facilities.map((item) => (
                  <li
                    key={item}
                    className="detail-row border-t border-hairline py-3 text-sm text-bone first:border-t-0 first:pt-0"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Glass>
          ))}
        </div>
      </div>

      {/*
        The place itself, drifting, between the specification and the enquiry.

        This was a horizontal strip of four close-ups on a scrubbed parallax.
        The strip is gone and so is its ScrollTrigger — the wall carries its
        own movement, and a scrubbed transform wrapped around a perspective
        plane fights it for the same pixels.

        The settings are pulled well back from the component's defaults. Its
        demo turns the wall 16 degrees and yaws it -14, which is a showreel
        pose; this is a hotel, and the photography has to stay readable as
        photography. Half the pitch, half the yaw, a longer perspective so the
        far columns do not shear, and a slower drift than the 42px/s default.
        `dim` sits high enough that the resting wall is a texture rather than
        a gallery demanding to be clicked.
      */}
      <div className="mt-14 h-[62svh] min-h-[22rem] w-full md:mt-16 md:h-[70svh]">
        <DriftWall
          items={WALL}
          columns={5}
          tileWidth={200}
          tileHeight={132}
          gap={18}
          radius={4}
          tilt={8}
          turn={-7}
          perspective={1600}
          depth={90}
          speed={26}
          direction="up"
          variance={0.4}
          parallax={0.45}
          lift={46}
          fade={0.62}
          dim={0.7}
          sizes="(min-width: 768px) 200px, 40vw"
        />
      </div>
    </section>
  );
}
