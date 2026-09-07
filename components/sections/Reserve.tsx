'use client';

import { useRef } from 'react';
import { ArrowUpRight, Phone } from 'lucide-react';
import Frame from '@/components/media/Frame';
import Glass from '@/components/ui/Glass';
import EnquiryFlow from '@/components/sections/EnquiryFlow';
import RevealText from '@/motion/primitives/RevealText';
import { CONTACT, RESERVE, STAY } from '@/lib/content';
import { gsap } from '@/lib/gsap';
import { useMotionEffect } from '@/motion/useMotionEffect';
import { CINEMA, CONTENT, EASE, SCRUB, STAGGER } from '@/motion/config';

const { phone, phoneHref, email, currency, ratesFrom } = CONTACT;

/**
 * There is no booking engine behind this site, so this does not pretend to be
 * one. It composes the enquiry the guest would otherwise have to type — which
 * hotel, when, how many — and hands it to whichever channel they prefer, with
 * the message already written.
 *
 * A form that looks like it books a room and does not is worse than no form.
 */
export default function Reserve({ defaultSlug }: { defaultSlug?: string }) {
  const root = useRef<HTMLElement>(null);

  /**
   * The one section that had no motion at all, on any viewport — which made
   * the page's last act arrive flat, immediately after the rooms sequence.
   *
   * Restrained on purpose: this is the section a guest is trying to *use*, so
   * the copy rises, the panel arrives, and nothing here waits on an animation
   * before it can be typed into.
   */
  useMotionEffect(root, () => {
    // Everything under the title, which now carries its own line mask.
    // Everything under the title, which now carries its own line mask and
    // must not be faded on top of it.
    gsap.from('.reserve-copy [data-lede]', {
      y: 22,
      opacity: 0,
      duration: CONTENT.slow,
      ease: EASE.outLong,
      stagger: STAGGER.items,
      scrollTrigger: { trigger: '.reserve-copy', start: 'top 82%', once: true },
    });

    gsap.from('.reserve-panel', {
      y: 28,
      opacity: 0,
      duration: CINEMA.fast,
      ease: EASE.out,
      scrollTrigger: { trigger: '.reserve-panel', start: 'top 86%', once: true },
    });

    // The photograph behind it drifts, so the panel reads as sitting over a
    // scene rather than on a flat backdrop.
    //
    // The trigger is the node, not `'#reserve'`. `useMotionEffect` runs inside
    // a `gsap.context` scoped to this section, so a selector string is
    // resolved *within* it — and `#reserve` is the section itself, never one
    // of its descendants. ScrollTrigger found nothing, warned, and silently
    // fell back to measuring the image instead of the section, which is close
    // enough to right that it went unnoticed.
    gsap.fromTo(
      '.reserve-plate img',
      { yPercent: -4 },
      {
        yPercent: 4,
        ease: EASE.none,
        scrollTrigger: {
          trigger: root.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: SCRUB.tight,
        },
      }
    );
  });

  return (
    <section
      ref={root}
      id="reserve"
      className="relative overflow-hidden bg-void py-20 md:py-28"
    >
      {/*
        The photograph used to sit at 30% under a scrim that was 62% black
        across its whole middle. The two together left a dark smudge that was
        neither a readable room nor a clean field — and, since <Glass> only
        earns its cost when there is something behind it to bend, the panel on
        the right was refracting nothing.

        So the art direction is directional now rather than uniform: the frame
        is bright enough to read, a vertical scrim still lands the section into
        black at both edges, and a horizontal one keeps the left column — which
        carries type straight on the photograph — on a dark ground. What is
        left lit is the right-hand side, which is exactly where the glass sits.
      */}
      <Frame
        slug="room-b-light"
        className="reserve-plate absolute inset-0 h-full w-full"
        ratio="fill"
        sizes="100vw"
        imgClassName="opacity-55"
        position="50% 60%"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, var(--color-void) 0%, color-mix(in oklab, var(--color-void) 42%, transparent) 30%, color-mix(in oklab, var(--color-void) 46%, transparent) 68%, var(--color-void) 100%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, color-mix(in oklab, var(--color-void) 88%, transparent) 0%, color-mix(in oklab, var(--color-void) 70%, transparent) 34%, transparent 62%)',
        }}
      />

      <div className="gutter relative grid gap-12 md:grid-cols-12 md:items-center md:gap-10">
        <div className="reserve-copy md:col-span-5">
          <RevealText
            as="h2"
            mode="lines"
            scale="cinema"
            className="type-display text-[clamp(2.5rem,6vw,5rem)] text-chalk"
          >
            {RESERVE.title}
          </RevealText>
          <p data-lede className="mt-5 max-w-[34ch] text-lg text-mist">
            {RESERVE.body}
          </p>

          <dl data-lede className="mt-10 flex flex-wrap gap-x-12 gap-y-5">
            {/* A nightly rate invented by a website is a price someone will
                arrive expecting. Either it is configured or it is not shown. */}
            {ratesFrom !== null ? (
              <div>
                <dt className="type-label">From</dt>
                <dd className="tabular mt-1 text-xl text-chalk">
                  {currency} {ratesFrom.toLocaleString('en-IN')}
                  <span className="ml-1 text-sm text-smoke">/ night</span>
                </dd>
              </div>
            ) : (
              <div>
                <dt className="type-label">Rates</dt>
                <dd className="mt-1 text-xl text-mist">On enquiry</dd>
              </div>
            )}
            <div>
              <dt className="type-label">Check in / out</dt>
              <dd className="tabular mt-1 text-xl text-chalk">
                {STAY.checkIn} <span className="text-smoke">/</span> {STAY.checkOut}
              </dd>
            </div>
          </dl>

          <div data-lede className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
            {phoneHref ? (
              <a
                href={phoneHref}
                className="inline-flex items-center gap-2 text-mist transition-colors hover:text-chalk"
              >
                <Phone size={15} strokeWidth={1.5} aria-hidden />
                <span className="tabular text-sm">{phone}</span>
              </a>
            ) : null}
            {email ? (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-2 text-mist transition-colors hover:text-chalk"
              >
                <span className="text-sm">{email}</span>
                <ArrowUpRight size={15} strokeWidth={1.5} aria-hidden />
              </a>
            ) : null}
            {!phoneHref && !email ? (
              <p className="text-sm text-ash">
                Telephone and email are {CONTACT.unset.toLowerCase()}.
              </p>
            ) : null}
          </div>
        </div>

        <div className="reserve-panel md:col-span-6 md:col-start-7">
          {/*
            One question at a time, rather than five fields at once. The panel
            keeps its own height and animates between steps, so advancing does
            not shunt the section — see `EnquiryFlow`, which also explains why
            the closing screen never claims the enquiry was sent.
          */}
          <Glass className="rounded-2xl p-6 md:p-9" radius={16} scale={-64}>
            <EnquiryFlow defaultSlug={defaultSlug} />
          </Glass>
        </div>
      </div>
    </section>
  );
}
