'use client';

import { useMemo, useRef, useState } from 'react';
import { ArrowUpRight, MessageCircle, Phone } from 'lucide-react';
import Frame from '@/components/media/Frame';
import Glass from '@/components/ui/Glass';
import { LOCATIONS, RESERVE, SITE, STAY, needsVerification } from '@/lib/content';
import { cn } from '@/lib/utils';
import { gsap } from '@/lib/gsap';
import { useMotionEffect } from '@/motion/useMotionEffect';
import { CINEMA, CONTENT, EASE, SCRUB, STAGGER } from '@/motion/config';

const { phone, phoneHref, whatsapp, email, currency, ratesFrom } = needsVerification;

const today = () => new Date().toISOString().slice(0, 10);

/**
 * There is no booking engine behind this site, so this does not pretend to be
 * one. It composes the enquiry the guest would otherwise have to type — which
 * hotel, when, how many — and hands it to whichever channel they prefer, with
 * the message already written.
 *
 * A form that looks like it books a room and does not is worse than no form.
 */
export default function Reserve({ defaultSlug }: { defaultSlug?: string }) {
  const [slug, setSlug] = useState(defaultSlug ?? LOCATIONS[0].slug);
  const [arrival, setArrival] = useState('');
  const root = useRef<HTMLElement>(null);
  const [nights, setNights] = useState(2);
  const [guests, setGuests] = useState(2);

  const location = LOCATIONS.find((l) => l.slug === slug) ?? LOCATIONS[0];

  const message = useMemo(() => {
    const when = arrival ? `arriving ${arrival}` : 'dates still flexible';
    return `Hello ${SITE.name} — I would like to enquire about a stay at ${location.name} (${location.area}). ${when}, ${nights} night${
      nights === 1 ? '' : 's'
    }, ${guests} guest${guests === 1 ? '' : 's'}. Could you confirm availability and the rate?`;
  }, [arrival, nights, guests, location]);

  const whatsappHref = `${whatsapp}?text=${encodeURIComponent(message)}`;
  const mailHref = `mailto:${email}?subject=${encodeURIComponent(
    `Enquiry — ${location.name}`
  )}&body=${encodeURIComponent(message)}`;

  const field =
    'w-full border-b border-hairline-strong bg-transparent py-2.5 text-bone outline-none transition-colors duration-300 focus-visible:border-chalk [color-scheme:dark]';

  /**
   * The one section that had no motion at all, on any viewport — which made
   * the page's last act arrive flat, immediately after the rooms sequence.
   *
   * Restrained on purpose: this is the section a guest is trying to *use*, so
   * the copy rises, the panel arrives, and nothing here waits on an animation
   * before it can be typed into.
   */
  useMotionEffect(root, () => {
    gsap.from('.reserve-copy > *', {
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
    gsap.fromTo(
      '.reserve-plate img',
      { yPercent: -4 },
      {
        yPercent: 4,
        ease: EASE.none,
        scrollTrigger: {
          trigger: '#reserve',
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
      <Frame
        slug="room-b-light"
        className="reserve-plate absolute inset-0 h-full w-full"
        ratio="fill"
        sizes="100vw"
        imgClassName="opacity-30"
        position="50% 60%"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, var(--color-void) 0%, color-mix(in oklab, var(--color-void) 62%, transparent) 38%, var(--color-void) 100%)',
        }}
      />

      <div className="gutter relative grid gap-12 md:grid-cols-12 md:items-center md:gap-10">
        <div className="reserve-copy md:col-span-5">
          <h2 className="type-display text-[clamp(2.5rem,6vw,5rem)] text-chalk">{RESERVE.title}</h2>
          <p className="mt-5 max-w-[34ch] text-lg text-mist">{RESERVE.body}</p>

          <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-5">
            <div>
              <dt className="type-label">From</dt>
              <dd className="tabular mt-1 text-xl text-chalk">
                {currency} {ratesFrom.toLocaleString('en-IN')}
                <span className="ml-1 text-sm text-smoke">/ night</span>
              </dd>
            </div>
            <div>
              <dt className="type-label">Check in / out</dt>
              <dd className="tabular mt-1 text-xl text-chalk">
                {STAY.checkIn} <span className="text-smoke">/</span> {STAY.checkOut}
              </dd>
            </div>
          </dl>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
            <a
              href={phoneHref}
              className="inline-flex items-center gap-2 text-mist transition-colors hover:text-chalk"
            >
              <Phone size={15} strokeWidth={1.5} aria-hidden />
              <span className="tabular text-sm">{phone}</span>
            </a>
            <a
              href={mailHref}
              className="inline-flex items-center gap-2 text-mist transition-colors hover:text-chalk"
            >
              <span className="text-sm">{email}</span>
              <ArrowUpRight size={15} strokeWidth={1.5} aria-hidden />
            </a>
          </div>
        </div>

        <div className="reserve-panel md:col-span-6 md:col-start-7">
          <Glass className="rounded-2xl p-6 md:p-9" radius={16} scale={-64}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                window.open(whatsappHref, '_blank', 'noopener,noreferrer');
              }}
            >
              <fieldset className="border-0 p-0">
                <legend className="type-label mb-3">Which one</legend>
                <div className="grid grid-cols-2 gap-2">
                  {LOCATIONS.map((loc) => {
                    const active = loc.slug === slug;
                    return (
                      <button
                        key={loc.slug}
                        type="button"
                        onClick={() => setSlug(loc.slug)}
                        aria-pressed={active}
                        className={cn(
                          'rounded-lg border px-4 py-3 text-left transition-colors duration-300',
                          active
                            ? 'border-chalk bg-chalk text-void'
                            : 'border-hairline-strong text-mist hover:border-chalk hover:text-chalk'
                        )}
                      >
                        <span className="block text-sm font-medium">{loc.shortName}</span>
                        <span
                          className={cn(
                            'mt-0.5 block text-xs',
                            active ? 'text-void/70' : 'text-smoke'
                          )}
                        >
                          {loc.room.name} · {loc.roomCount} rooms
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="mt-7 grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="arrival" className="type-label mb-1 block">
                    Arriving
                  </label>
                  <input
                    id="arrival"
                    type="date"
                    min={today()}
                    value={arrival}
                    onChange={(e) => setArrival(e.target.value)}
                    className={field}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="nights" className="type-label mb-1 block">
                      Nights
                    </label>
                    <input
                      id="nights"
                      type="number"
                      min={1}
                      max={60}
                      value={nights}
                      onChange={(e) => setNights(Math.max(1, Number(e.target.value) || 1))}
                      className={`${field} tabular`}
                    />
                  </div>
                  <div>
                    <label htmlFor="guests" className="type-label mb-1 block">
                      Guests
                    </label>
                    <input
                      id="guests"
                      type="number"
                      min={1}
                      max={4}
                      value={guests}
                      onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
                      className={`${field} tabular`}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                data-cursor="Send"
                className="mt-9 flex w-full items-center justify-center gap-2 rounded-full bg-chalk py-3.5 font-medium text-void transition-[background-color,transform] duration-300 hover:bg-bone active:scale-[0.99]"
              >
                <MessageCircle size={16} strokeWidth={1.75} aria-hidden />
                {RESERVE.cta} on WhatsApp
              </button>

              <p className="mt-4 text-center text-xs text-smoke">
                Opens WhatsApp with your enquiry written.{' '}
                <a href={mailHref} className="text-mist underline underline-offset-4 hover:text-chalk">
                  Send it by email instead
                </a>
                .
              </p>
            </form>
          </Glass>
        </div>
      </div>
    </section>
  );
}
