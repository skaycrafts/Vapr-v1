'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Check, Copy, MessageCircle } from 'lucide-react';
import { CONTACT, LOCATIONS, RESERVE, SITE } from '@/lib/content';
import { cn } from '@/lib/utils';
import { gsap } from '@/lib/gsap';
import { useCapability } from '@/motion/capability';
import { CONTENT, EASE } from '@/motion/config';

const { whatsapp, email: deskEmail } = CONTACT;

const today = () => new Date().toISOString().slice(0, 10);

/**
 * The enquiry, asked one question at a time.
 *
 * ── Why this replaced a single panel of fields ──────────────────────────
 * The form was five controls in one view: which hotel, arriving, nights,
 * guests, and a send button. Everything was visible, nothing was hard, and
 * almost nobody finished it — a wall of fields reads as work before it reads
 * as a conversation, and this is the one place on the site where a guest is
 * being asked to give something rather than look at something.
 *
 * So it asks one thing per screen, in the order a person would say it out
 * loud: who you are, which one, when, and how to reach you. Each answer is
 * small enough to give without thinking, the step counter says how much is
 * left, and nothing is lost going backwards.
 *
 * ── What it does NOT do ────────────────────────────────────────────────
 * It does not say "Enquiry sent". There is no booking engine and no inbox
 * behind this site: the last step composes the message and hands it to the
 * guest's own WhatsApp or mail app, where they still have to press send. A
 * confirmation screen claiming otherwise would be the single most damaging
 * sentence on the site — someone would sit waiting for a reply to a message
 * that was never sent.
 *
 * So the closing screen names what actually happened, and it changes with the
 * channel that was actually available. With none configured it copies the
 * enquiry and says so.
 */

type Step = {
  readonly id: string;
  readonly question: string;
  readonly hint: string;
};

const STEPS: readonly Step[] = [
  { id: 'name', question: 'First, what should we call you?', hint: 'It keeps the reply personal.' },
  {
    id: 'where',
    question: 'Which one?',
    hint: 'Twenty minutes apart. You can change your mind later.',
  },
  { id: 'stay', question: 'When, and how many?', hint: 'Leave the dates empty if they are still moving.' },
  { id: 'phone', question: 'A number we can reach you on?', hint: 'Optional — the desk calls before it emails.' },
  { id: 'email', question: 'And an email?', hint: 'Optional. Rooms, rates and a reply go here.' },
] as const;

const UNSURE = 'unsure';

/** Loose on purpose: this validates shape, not existence, and never blocks. */
const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const looksLikePhone = (v: string) => /^[+()\d][\s\-()\d]{6,}$/.test(v.trim());

export default function EnquiryFlow({ defaultSlug }: { defaultSlug?: string }) {
  const { animate } = useCapability();

  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<'form' | 'sending' | 'done'>('form');

  const [name, setName] = useState('');
  const [slug, setSlug] = useState<string>(defaultSlug ?? '');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  /** Which channel actually carried it. Set once, when it is handed off. */
  const [sentVia, setSentVia] = useState<'whatsapp' | 'email' | 'clipboard' | null>(null);

  const location = LOCATIONS.find((l) => l.slug === slug) ?? null;

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return null;
    const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    const n = Math.round(ms / 86_400_000);
    return n > 0 ? n : null;
  }, [checkIn, checkOut]);

  /**
   * The whole enquiry as one paragraph, in the guest's voice.
   *
   * Every clause is conditional, because every field except the name is
   * optional — a message that says "arriving , 0 nights" is worse than one
   * that simply does not mention dates.
   */
  const message = useMemo(() => {
    const where = location
      ? `${location.name} (${location.area})`
      : 'either of your two hotels — I am not sure which yet';

    const when = checkIn
      ? `arriving ${checkIn}${checkOut ? `, leaving ${checkOut}` : ''}${
          nights ? ` (${nights} night${nights === 1 ? '' : 's'})` : ''
        }`
      : 'dates still flexible';

    const party = `${guests} guest${guests === 1 ? '' : 's'}, ${rooms} room${rooms === 1 ? '' : 's'}`;

    const reach = [
      phone.trim() ? `phone ${phone.trim()}` : null,
      email.trim() ? `email ${email.trim()}` : null,
    ].filter(Boolean);

    return [
      `Hello ${SITE.name} — this is ${name.trim() || 'a guest'}.`,
      `I would like to enquire about a stay at ${where}.`,
      `${when.charAt(0).toUpperCase()}${when.slice(1)}, ${party}.`,
      reach.length ? `You can reach me on ${reach.join(', ')}.` : null,
      'Could you confirm availability and the rate?',
    ]
      .filter(Boolean)
      .join(' ');
  }, [location, checkIn, checkOut, nights, guests, rooms, phone, email, name]);

  const whatsappHref = whatsapp ? `${whatsapp}?text=${encodeURIComponent(message)}` : null;
  const mailHref = deskEmail
    ? `mailto:${deskEmail}?subject=${encodeURIComponent(
        `Enquiry — ${location ? location.name : SITE.name}`
      )}&body=${encodeURIComponent(message)}`
    : null;

  /** Can the current step be left? Only the name and the choice are required. */
  const canAdvance = useMemo(() => {
    switch (STEPS[step].id) {
      case 'name':
        return name.trim().length > 1;
      case 'where':
        return slug !== '';
      case 'phone':
        return phone.trim() === '' || looksLikePhone(phone);
      case 'email':
        return email.trim() === '' || looksLikeEmail(email);
      default:
        return true;
    }
  }, [step, name, slug, phone, email]);

  const send = useCallback(async () => {
    setStatus('sending');

    // A beat, so the button's state change is legible rather than a flicker.
    // It is not a fake network call: nothing is being waited on.
    await new Promise((r) => window.setTimeout(r, 620));

    if (whatsappHref) {
      window.open(whatsappHref, '_blank', 'noopener,noreferrer');
      setSentVia('whatsapp');
    } else if (mailHref) {
      window.location.href = mailHref;
      setSentVia('email');
    } else {
      try {
        await navigator.clipboard.writeText(message);
      } catch {
        // A refused clipboard is not worth interrupting anyone over — the
        // closing screen shows the message and it stays selectable.
      }
      setSentVia('clipboard');
    }

    setStatus('done');
  }, [whatsappHref, mailHref, message]);

  // ── Motion ──────────────────────────────────────────────────────────────
  const stage = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const height = useRef<number | null>(null);
  const firstField = useRef<HTMLElement | null>(null);
  const interacted = useRef(false);

  /**
   * The stage carries the height; the panel carries the content.
   *
   * ── Why a ResizeObserver rather than an effect on the step ────────────
   * This first measured on `[step, status, slug]` and wrote a fixed pixel
   * height. Two things were wrong with that. Selecting a hotel is a change to
   * `slug`, so picking one re-ran the whole entrance and the panel flashed
   * under the cursor. And a pixel height set once is a pixel height forever:
   * the moment the window was resized, a font finished loading or the derived
   * "3 nights" line appeared, the content was taller than the box holding it
   * and the bottom of the step was cut off.
   *
   * Observing the panel fixes both at once. Any change to the content's real
   * height — a step, a selection, a reflow, a resize — animates the stage to
   * meet it, and nothing about that is coupled to which step is showing.
   */
  useLayoutEffect(() => {
    const el = stage.current;
    const inner = panel.current;
    if (!el || !inner) return;

    const sync = () => {
      const next = inner.offsetHeight;
      if (next === height.current) return;

      const prev = height.current;
      height.current = next;

      // The first measure has nothing to travel from, and a reduced-motion
      // visitor gets the height without the journey.
      if (!animate || prev === null) {
        gsap.set(el, { height: next });
        return;
      }
      gsap.to(el, { height: next, duration: CONTENT.fast, ease: EASE.out, overwrite: true });
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [animate]);

  /**
   * The entrance, which belongs to the step and not to the height. Keyed on
   * the step and the status alone, so answering a question never replays it.
   */
  useLayoutEffect(() => {
    const inner = panel.current;
    if (!inner || !animate || !interacted.current) return;

    gsap.fromTo(
      inner,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: CONTENT.fast, ease: EASE.outLong, overwrite: true }
    );
  }, [step, status, animate]);

  /**
   * Focus the step's first field — but only once the guest has actually moved
   * a step. Doing it on mount would steal focus from the page while someone is
   * still reading, and this section sits two thirds of the way down.
   */
  useEffect(() => {
    if (!interacted.current) return;
    firstField.current?.focus({ preventScroll: true });
  }, [step, status]);

  const go = (to: number) => {
    interacted.current = true;
    setStep(to);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdvance) return;
    interacted.current = true;
    if (step < STEPS.length - 1) setStep(step + 1);
    else void send();
  };

  const reset = () => {
    interacted.current = false;
    setStatus('form');
    setSentVia(null);
    setStep(0);
  };

  const field =
    'w-full border-b border-hairline-strong bg-transparent py-2.5 text-lg text-bone transition-colors duration-300 placeholder:text-smoke focus-visible:border-ink [color-scheme:dark]';
  const small = 'w-full border-b border-hairline-strong bg-transparent py-2 text-bone transition-colors duration-300 focus-visible:border-ink [color-scheme:dark]';

  // ── The closing screen ──────────────────────────────────────────────────
  if (status === 'done') {
    const heading =
      sentVia === 'clipboard' ? 'Copied to your clipboard.' : 'Your enquiry is written.';

    const body =
      sentVia === 'whatsapp'
        ? `Thanks, ${name.trim()} — WhatsApp is open with everything filled in. Press send there and someone answers.`
        : sentVia === 'email'
          ? `Thanks, ${name.trim()} — your mail app is open with everything filled in. Press send there and someone answers.`
          : `Thanks, ${name.trim()} — the enquiry is on your clipboard. No enquiry channel is configured on this site yet, so paste it wherever you can reach us.`;

    return (
      <div ref={stage} className="overflow-hidden">
        <div ref={panel}>
          <span
            aria-hidden
            className="flex size-11 items-center justify-center rounded-full border border-ink/40"
          >
            <Check size={18} strokeWidth={1.5} className="text-ink" />
          </span>

          <h3 className="type-display mt-6 text-[clamp(1.6rem,3vw,2.25rem)] text-ink">
            {heading}
          </h3>
          <p className="mt-3 max-w-[38ch] text-mist">{body}</p>

          {/* The message stays visible and selectable. If the hand-off was
              refused — a blocked popup, a machine with no mail client — this
              is still a working way to get it out. */}
          <p className="mt-6 max-w-[46ch] rounded-lg border border-hairline bg-glass p-4 text-sm leading-relaxed text-smoke">
            {message}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-hairline-strong px-6 py-3 text-sm text-mist transition-colors duration-300 hover:border-ink hover:text-ink"
            >
              Start another
            </button>
            {location ? (
              <a
                href={`/${location.slug}`}
                data-cursor="Open"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors duration-300 hover:bg-bone"
              >
                See {location.shortName}
                <ArrowUpRight size={15} strokeWidth={1.75} aria-hidden />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <form onSubmit={onSubmit}>
      {/* ── Progress ──────────────────────────────────────────────────── */}
      <div className="mb-7">
        <div className="flex items-baseline justify-between">
          <p className="type-label">
            Enquiry · {String(step + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
          </p>
          <p className="type-label text-smoke">{current.id === 'name' ? 'About a minute' : ''}</p>
        </div>
        <div className="mt-3 h-px w-full bg-hairline">
          <div
            className="h-full origin-left bg-ink transition-transform duration-500 ease-out"
            style={{ transform: `scaleX(${(step + 1) / STEPS.length})` }}
          />
        </div>
      </div>

      <div ref={stage} className="overflow-hidden">
        <div ref={panel}>
          <h3 className="type-display text-[clamp(1.6rem,3vw,2.25rem)] leading-[1.1] text-ink">
            {current.question}
          </h3>
          <p className="mt-2 text-sm text-smoke">{current.hint}</p>

          <div className="mt-7">
            {current.id === 'name' ? (
              <input
                ref={firstField as React.RefObject<HTMLInputElement>}
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                aria-label="Your name"
                className={field}
              />
            ) : null}

            {current.id === 'where' ? (
              <fieldset className="border-0 p-0">
                <legend className="sr-only">Which hotel</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {LOCATIONS.map((loc, i) => {
                    const active = loc.slug === slug;
                    return (
                      <button
                        key={loc.slug}
                        ref={i === 0 ? (firstField as React.RefObject<HTMLButtonElement>) : undefined}
                        type="button"
                        onClick={() => setSlug(loc.slug)}
                        aria-pressed={active}
                        className={cn(
                          'rounded-lg border px-4 py-3.5 text-left transition-colors duration-300',
                          active
                            ? 'border-ink bg-ink text-paper'
                            : 'border-hairline-strong text-mist hover:border-ink hover:text-ink'
                        )}
                      >
                        <span className="block text-sm font-medium">{loc.shortName}</span>
                        <span
                          className={cn('mt-0.5 block text-xs', active ? 'text-paper/70' : 'text-smoke')}
                        >
                          {loc.room.name} · {loc.roomCount} rooms
                        </span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setSlug(UNSURE)}
                    aria-pressed={slug === UNSURE}
                    className={cn(
                      'rounded-lg border px-4 py-3.5 text-left transition-colors duration-300 sm:col-span-2',
                      slug === UNSURE
                        ? 'border-ink bg-ink text-paper'
                        : 'border-hairline-strong text-mist hover:border-ink hover:text-ink'
                    )}
                  >
                    <span className="block text-sm font-medium">Not sure yet</span>
                    <span
                      className={cn(
                        'mt-0.5 block text-xs',
                        slug === UNSURE ? 'text-paper/70' : 'text-smoke'
                      )}
                    >
                      Tell us what you need and we will suggest one
                    </span>
                  </button>
                </div>
              </fieldset>
            ) : null}

            {current.id === 'stay' ? (
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="check-in" className="type-label mb-1 block">
                    Check in
                  </label>
                  <input
                    ref={firstField as React.RefObject<HTMLInputElement>}
                    id="check-in"
                    type="date"
                    min={today()}
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className={small}
                  />
                </div>
                <div>
                  <label htmlFor="check-out" className="type-label mb-1 block">
                    Check out
                  </label>
                  <input
                    id="check-out"
                    type="date"
                    min={checkIn || today()}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className={small}
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
                    max={12}
                    value={guests}
                    onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
                    className={`${small} tabular`}
                  />
                </div>
                <div>
                  <label htmlFor="rooms" className="type-label mb-1 block">
                    Rooms
                  </label>
                  <input
                    id="rooms"
                    type="number"
                    min={1}
                    max={8}
                    value={rooms}
                    onChange={(e) => setRooms(Math.max(1, Number(e.target.value) || 1))}
                    className={`${small} tabular`}
                  />
                </div>
                {nights ? (
                  <p className="tabular text-sm text-smoke sm:col-span-2">
                    {nights} night{nights === 1 ? '' : 's'}.
                  </p>
                ) : null}
              </div>
            ) : null}

            {current.id === 'phone' ? (
              <input
                ref={firstField as React.RefObject<HTMLInputElement>}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91"
                aria-label="Your phone number"
                aria-invalid={phone.trim() !== '' && !looksLikePhone(phone)}
                className={field}
              />
            ) : null}

            {current.id === 'email' ? (
              <input
                ref={firstField as React.RefObject<HTMLInputElement>}
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Your email address"
                aria-invalid={email.trim() !== '' && !looksLikeEmail(email)}
                className={field}
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Controls ──────────────────────────────────────────────────── */}
      <div className="mt-8 flex items-center gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => go(step - 1)}
            className="inline-flex items-center gap-2 rounded-full border border-hairline-strong px-5 py-3 text-sm text-mist transition-colors duration-300 hover:border-ink hover:text-ink"
          >
            <ArrowLeft size={15} strokeWidth={1.75} aria-hidden />
            Back
          </button>
        ) : null}

        <button
          type="submit"
          disabled={!canAdvance || status === 'sending'}
          data-cursor={last ? 'Send' : undefined}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 font-medium transition-[background-color,opacity,transform] duration-300',
            'bg-ink text-paper hover:bg-bone active:scale-[0.99]',
            'disabled:cursor-not-allowed disabled:opacity-35 disabled:active:scale-100'
          )}
        >
          {status === 'sending' ? (
            'Composing…'
          ) : last ? (
            <>
              {whatsappHref ? (
                <MessageCircle size={16} strokeWidth={1.75} aria-hidden />
              ) : mailHref ? (
                <ArrowUpRight size={16} strokeWidth={1.75} aria-hidden />
              ) : (
                <Copy size={16} strokeWidth={1.75} aria-hidden />
              )}
              {RESERVE.cta}
            </>
          ) : (
            'Continue'
          )}
        </button>
      </div>

      {/*
        What the last button will actually do, said before it is pressed. The
        guest should never discover the channel after committing to it.
      */}
      {last ? (
        <p className="mt-4 text-center text-xs text-smoke">
          {whatsappHref
            ? 'Opens WhatsApp with the enquiry written. You press send.'
            : mailHref
              ? 'Opens your mail app with the enquiry written. You press send.'
              : 'No enquiry channel is configured yet, so this copies the message for you to send.'}
        </p>
      ) : null}

      <p aria-live="polite" className="sr-only">
        Step {step + 1} of {STEPS.length}. {current.question}
      </p>
    </form>
  );
}
