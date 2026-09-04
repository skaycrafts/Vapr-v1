'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * The entry sequence's clock.
 *
 * The overture and the hero are one continuous piece of choreography, not two
 * animations that happen to follow each other — the field is still lifting
 * while the headline is already rising behind it. That overlap is what makes
 * the first three seconds read as directed rather than sequential (§03).
 *
 * To coordinate across component boundaries, the overture broadcasts the
 * moment the field *starts* lifting. Everything downstream schedules itself
 * against that instant using the offsets below.
 *
 * The clock got longer when the overture gained a counter: 1 → 100 has to be
 * legible as it runs, and a count that finishes in half a second is a flicker,
 * not a count. Everything after `lift` is unchanged in *relative* terms — the
 * headline still arrives 0.3s after the field starts moving — because every
 * downstream section schedules against `lift` rather than against zero.
 */

export const ENTRY = {
  /** The mark resolves. */
  mark: 0.2,
  /** The count begins, and the rule under it starts to fill. */
  count: 0.35,
  /** How long 1 → 100 takes. */
  countFor: 1.7,
  /** The field begins to lift. */
  lift: 2.15,
  /** The headline rises. Overlaps the lift on purpose. */
  headline: 2.45,
  /** Navigation settles in. */
  nav: 2.8,
  /** The scroll indicator, last — it invites the next action. */
  cue: 3.15,
} as const;

type EntryState = {
  /** True from the moment the field starts lifting: downstream may begin. */
  started: boolean;
  /** True once the whole sequence is finished and the page is interactive. */
  done: boolean;
  begin: () => void;
  finish: () => void;
};

const EntryContext = createContext<EntryState>({
  started: true,
  done: true,
  begin: () => {},
  finish: () => {},
});

export const useEntry = () => useContext(EntryContext);

export function EntryProvider({ children }: { children: React.ReactNode }) {
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  // Stable identities: the overture's timeline depends on these, and a fresh
  // function each render would rebuild it mid-flight.
  const begin = useCallback(() => setStarted(true), []);
  const finish = useCallback(() => setDone(true), []);

  const value = useMemo<EntryState>(
    () => ({ started, done, begin, finish }),
    [started, done, begin, finish]
  );

  return <EntryContext.Provider value={value}>{children}</EntryContext.Provider>;
}
