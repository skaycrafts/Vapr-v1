'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, MessageCircle, Phone } from 'lucide-react';
import Frame from '@/components/media/Frame';
import Glass from '@/components/ui/Glass';
import { RESERVE, ROOMS, SITE, needsVerification } from '@/lib/content';

const { phone, phoneHref, whatsapp, email, currency, ratesFrom } = needsVerification;

const today = () => new Date().toISOString().slice(0, 10);

/**
 * There is no booking engine behind this site, so this does not pretend to be
 * one. It composes the enquiry the guest would otherwise have to type, and
 * hands it to whichever channel they prefer — the message is already written
 * when WhatsApp or the mail client opens.
 *
 * A form that looks like it books a room and does not is worse than no form.
 */
export default function Reserve() {
  const [arrival, setArrival] = useState('');
  const [nights, setNights] = useState(2);
  const [guests, setGuests] = useState(2);
  const [room, setRoom] = useState<string>(ROOMS[0].name);

  const message = useMemo(() => {
    const when = arrival ? `arriving ${arrival}` : 'dates still flexible';
    return `Hello ${SITE.name} — I would like to enquire about a stay. ${
      room
    }, ${when}, ${nights} night${nights === 1 ? '' : 's'}, ${guests} guest${
      guests === 1 ? '' : 's'
    }. Could you confirm availability?`;
  }, [arrival, nights, guests, room]);

  const whatsappHref = `${whatsapp}?text=${encodeURIComponent(message)}`;
  const mailHref = `mailto:${email}?subject=${encodeURIComponent(
    `Enquiry — ${room}`
  )}&body=${encodeURIComponent(message)}`;

  const field =
    'w-full border-b border-hairline-strong bg-transparent py-2.5 text-bone outline-none transition-colors duration-300 focus-visible:border-chalk [color-scheme:dark]';

  return (
    <section id="reserve" className="relative overflow-hidden bg-void py-20 md:py-32">
      <Frame
        slug="room-b-light"
        className="absolute inset-0 h-full w-full"
        ratio="fill"
        sizes="100vw"
        imgClassName="opacity-45"
        position="50% 60%"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, var(--color-void) 0%, color-mix(in oklab, var(--color-void) 55%, transparent) 38%, var(--color-void) 100%)',
        }}
      />

      <div className="gutter relative grid gap-12 md:grid-cols-12 md:items-center md:gap-10">
        <div className="md:col-span-5">
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
              <dt className="type-label">Reception</dt>
              <dd className="mt-1 text-xl text-chalk">24 hours</dd>
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

        <div className="md:col-span-6 md:col-start-7">
          <Glass className="rounded-2xl p-6 md:p-9" radius={16} scale={-64}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                window.open(whatsappHref, '_blank', 'noopener,noreferrer');
              }}
            >
              <p className="type-label mb-7">Compose an enquiry</p>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="room" className="type-label mb-1 block">
                    Room
                  </label>
                  <select
                    id="room"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className={field}
                  >
                    {ROOMS.map((r) => (
                      <option key={r.id} value={r.name} className="bg-carbon text-bone">
                        {r.name} — {r.bed}
                      </option>
                    ))}
                  </select>
                </div>

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
                      max={6}
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
