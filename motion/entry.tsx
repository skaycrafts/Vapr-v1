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
 */

export const ENTRY = {
  /** The mark resolves. */
  mark: 0.3,
  /** The field begins to lift; the photograph is revealed behind it. */
  lift: 0.55,
  /** The headline rises. Overlaps the lift on purpose. */
  headline: 0.85,
  /** Navigation settles in. */
  nav: 1.2,
  /** The scroll indicator, last — it invites the next action. */
  cue: 1.55,
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
