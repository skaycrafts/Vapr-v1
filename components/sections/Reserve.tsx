'use client';

import { useRef } from 'react';
import { ArrowUpRight, Phone } from 'lucide-react';
import Frame from '@/components/media/Frame';
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
      className="relative overflow-hidden bg-paper py-20 md:py-28"
    >
      {/*
        The scrims here were built to sink a photograph into black, and this
        section is on paper now. Left alone they did the same job in the same
        direction and bleached the frame to nearly nothing — a room you could
        only just make out under a wash of white.

        So they are inverted in intent as well as in colour. The photograph
        runs at full strength through the middle of the section, which is what
        the reference does: the picture is the only colour in an otherwise
        monochrome page, and dimming it throws away the one thing carrying any.
        The vertical gradient now only lands the top and bottom edges into the
        page so the section has no seam, and the horizontal one holds paper
        across the left column — where type sits directly on the frame — and
        releases it by 66%, which is where the glass panel begins.
      */}
      <Frame
        slug="room-b-light"
        className="reserve-plate absolute inset-0 h-full w-full"
        ratio="fill"
        sizes="100vw"
        imgClassName="opacity-90"
        position="50% 60%"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, var(--color-paper) 0%, color-mix(in oklab, var(--color-paper) 30%, transparent) 16%, transparent 46%, color-mix(in oklab, var(--color-paper) 34%, transparent) 84%, var(--color-paper) 100%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, color-mix(in oklab, var(--color-paper) 96%, transparent) 0%, color-mix(in oklab, var(--color-paper) 92%, transparent) 30%, color-mix(in oklab, var(--color-paper) 55%, transparent) 48%, transparent 66%)',
        }}
      />

      <div className="gutter relative grid gap-12 md:grid-cols-12 md:items-center md:gap-10">
        <div className="reserve-copy md:col-span-5">
          <RevealText
            as="h2"
            mode="lines"
            scale="cinema"
            className="type-display text-[clamp(2.5rem,6vw,5rem)] text-ink"
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
                <dd className="tabular mt-1 text-xl text-ink">
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
              <dd className="tabular mt-1 text-xl text-ink">
                {STAY.checkIn} <span className="text-smoke">/</span> {STAY.checkOut}
              </dd>
            </div>
          </dl>

          <div data-lede className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
            {phoneHref ? (
              <a
                href={phoneHref}
                className="inline-flex items-center gap-2 text-mist transition-colors hover:text-ink"
              >
                <Phone size={15} strokeWidth={1.5} aria-hidden />
                <span className="tabular text-sm">{phone}</span>
              </a>
            ) : null}
            {email ? (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-2 text-mist transition-colors hover:text-ink"
              >
                <span className="text-sm">{email}</span>
                <ArrowUpRight size={15} strokeWidth={1.5} aria-hidden />
              </a>
            ) : null}
            {!phoneHref && !email ? (
              <p className="text-sm text-smoke">
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
          {/*
            A solid card, not glass.

            <Glass> was right when this floated over a photograph on a black
            page: the panel darkened what was behind it and the form sat on a
            deep, even ground. On paper the same translucency puts pale type
            and a hairline underline over a lit room — measured, the field
            placeholder fell to about 1.6:1 — and no amount of tinting fixes a
            panel you can see a bedspread through.

            The reference does not use glass here either. Its floating panels
            are opaque white with a soft edge, for the same reason: a form is
            the one place on a page where legibility outranks material.
          */}
          <div className="rounded-2xl bg-paper p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_-12px_rgba(0,0,0,0.18)] ring-1 ring-hairline md:p-9">
            <EnquiryFlow defaultSlug={defaultSlug} />
          </div>
        </div>
      </div>
    </section>
  );
}
