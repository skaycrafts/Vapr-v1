'use client';

import { createContext, useContext, useMemo, useState } from 'react';

type IntroState = {
  /** True once the entry sequence has finished and the page may animate in. */
  ready: boolean;
  /** True when the entry sequence is being skipped entirely. */
  skipped: boolean;
  finish: () => void;
};

const IntroContext = createContext<IntroState>({ ready: true, skipped: true, finish: () => {} });

export const useIntro = () => useContext(IntroContext);

export function IntroProvider({
  children,
  skipped = false,
}: {
  children: React.ReactNode;
  skipped?: boolean;
}) {
  const [ready, setReady] = useState(skipped);
  const value = useMemo<IntroState>(
    () => ({ ready, skipped, finish: () => setReady(true) }),
    [ready, skipped]
  );
  return <IntroContext.Provider value={value}>{children}</IntroContext.Provider>;
}
