'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type IntroState = {
  /** True once the entry sequence has finished and the page may animate in. */
  ready: boolean;
  finish: () => void;
};

const IntroContext = createContext<IntroState>({ ready: true, finish: () => {} });

export const useIntro = () => useContext(IntroContext);

export function IntroProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  // Stable identity: the entry sequence's effect depends on this, and a new
  // function on every state change would re-run it.
  const finish = useCallback(() => setReady(true), []);

  const value = useMemo<IntroState>(() => ({ ready, finish }), [ready, finish]);
  return <IntroContext.Provider value={value}>{children}</IntroContext.Provider>;
}
