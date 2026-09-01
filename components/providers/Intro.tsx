'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type IntroState = {
  /** True once the entry sequence has finished and the page may animate in. */
  ready: boolean;
  finish: () => void;
};

const IntroContext = createContext<IntroState>({ ready: true, finish: () => {} });

export const useIntro = () => useContext(IntroContext);

export const INTRO_STORAGE_KEY = 'vapr:intro';

/** Whether the entry sequence has already played this session. */
export function introAlreadySeen() {
  try {
    return sessionStorage.getItem(INTRO_STORAGE_KEY) === '1';
  } catch {
    // Private modes can throw on access; treat it as a first visit.
    return false;
  }
}

export function markIntroSeen() {
  try {
    sessionStorage.setItem(INTRO_STORAGE_KEY, '1');
  } catch {
    /* no-op */
  }
}

export function IntroProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  // Stable identity: the entry sequence's effect depends on this, and a new
  // function on every state change would re-run it.
  const finish = useCallback(() => setReady(true), []);

  const value = useMemo<IntroState>(() => ({ ready, finish }), [ready, finish]);
  return <IntroContext.Provider value={value}>{children}</IntroContext.Provider>;
}
