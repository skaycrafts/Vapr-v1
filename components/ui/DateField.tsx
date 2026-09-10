'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A date field that opens its own calendar, in the site's own colours.
 *
 * ── Why not `<input type="date">` ───────────────────────────────────────
 * That is what this replaced, and it looked like whatever browser the guest
 * happened to be using: Chrome's grey chrome on Windows, a wheel on iOS, a
 * different grey on Firefox. `[color-scheme: dark]` was the only lever over
 * any of it and it does not survive a page with two grounds. On a page where
 * the enquiry is the one thing being asked of anyone, the one control that is
 * plainly borrowed from somewhere else is the wrong one to leave.
 *
 * ── Why it expands rather than floats ───────────────────────────────────
 * The enquiry panel measures its own content and animates between heights,
 * and the stage that does the measuring is `overflow: hidden` — so an
 * absolutely-positioned popover would be clipped by the very thing that makes
 * the steps move smoothly. Opening in flow means the panel grows to meet it,
 * with no portal, no clipping and no second scroll context to trap focus in.
 */

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Local-time YYYY-MM-DD. `toISOString` is UTC and shifts the date east of it. */
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const pretty = (s: string) => {
  const d = parse(s);
  if (!d) return null;
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
};

export type DateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Inclusive earliest selectable date, as YYYY-MM-DD. */
  min?: string;
  placeholder?: string;
  inputRef?: React.Ref<HTMLButtonElement>;
};

export default function DateField({
  label,
  value,
  onChange,
  min,
  placeholder = 'Select a date',
  inputRef,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const minDate = useMemo(() => (min ? parse(min) : null), [min]);
  const selected = useMemo(() => parse(value), [value]);

  // The month on show. Follows the selection, then the floor, then today.
  const [cursor, setCursor] = useState(() =>
    startOfDay(selected ?? minDate ?? new Date())
  );

  useEffect(() => {
    if (selected) setCursor(new Date(selected.getFullYear(), selected.getMonth(), 1));
    else if (minDate) setCursor(new Date(minDate.getFullYear(), minDate.getMonth(), 1));
  }, [selected, minDate]);

  /** Escape closes; so does a click that lands outside. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const lead = first.getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= days; d += 1) cells.push(new Date(year, month, d));
    return cells;
  }, [cursor]);

  const floor = minDate ? startOfDay(minDate).getTime() : -Infinity;
  const step = (by: number) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + by, 1));

  // Never let the guest page back past the earliest month they could pick.
  const canGoBack = !minDate || cursor > new Date(minDate.getFullYear(), minDate.getMonth(), 1);

  return (
    <div ref={rootRef} className="relative">
      <span id={`${id}-label`} className="type-label mb-1 block">
        {label}
      </span>

      <button
        ref={inputRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-labelledby={`${id}-label`}
        className={cn(
          'flex w-full items-baseline justify-between gap-2 border-b border-hairline-strong bg-transparent py-2 text-left transition-colors duration-300 hover:border-ink focus-visible:border-ink',
          value ? 'text-bone' : 'text-smoke'
        )}
      >
        <span className="tabular">{pretty(value) ?? placeholder}</span>
      </button>

      {open ? (
        <div className="mt-3 rounded-xl border border-hairline bg-glass p-3">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={!canGoBack}
              aria-label="Previous month"
              className="rounded-full p-1.5 text-mist transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={16} strokeWidth={1.75} aria-hidden />
            </button>
            <span aria-live="polite" className="text-sm text-bone">
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next month"
              className="rounded-full p-1.5 text-mist transition-colors hover:text-ink"
            >
              <ChevronRight size={16} strokeWidth={1.75} aria-hidden />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {DAYS.map((d, i) => (
              // The initials repeat (S, T), so they are labelled by position.
              <span key={i} className="type-label py-1 text-center text-ash">
                {d}
              </span>
            ))}

            {grid.map((date, i) => {
              if (!date) return <span key={`pad-${i}`} />;
              const disabled = date.getTime() < floor;
              const isSelected = Boolean(selected && iso(selected) === iso(date));
              return (
                <button
                  key={iso(date)}
                  type="button"
                  disabled={disabled}
                  aria-pressed={isSelected}
                  onClick={() => {
                    onChange(iso(date));
                    setOpen(false);
                  }}
                  className={cn(
                    'tabular aspect-square rounded-md text-sm transition-colors duration-200',
                    disabled && 'cursor-not-allowed text-ash/40',
                    !disabled && !isSelected && 'text-bone hover:bg-ink/10 hover:text-ink',
                    isSelected && 'bg-ink font-medium text-paper'
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
