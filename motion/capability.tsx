'use client';

import { createContext, useContext, useMemo, useSyncExternalStore } from 'react';

/**
 * One place that knows what this device is willing to do.
 *
 * Before this existed, every section ran its own
 * `matchMedia('(prefers-reduced-motion: reduce)')` at effect time. That is
 * fragile in two ways: a section that forgets the check silently violates the
 * preference, and a check read once at mount never notices the visitor
 * changing the setting. `useSyncExternalStore` fixes both — it subscribes, and
 * it has a defined server snapshot so SSR and hydration agree.
 */

type Query = '(prefers-reduced-motion: reduce)' | '(pointer: fine)' | '(hover: hover)';

/** Server render assumes the conservative answer: no motion, no pointer. */
const SERVER_SNAPSHOT = false;

function subscribe(query: Query) {
  return (onChange: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  };
}

function useMediaQuery(query: Query): boolean {
  return useSyncExternalStore(
    useMemo(() => subscribe(query), [query]),
    () => window.matchMedia(query).matches,
    () => SERVER_SNAPSHOT
  );
}

export type Capability = {
  /**
   * False until the client has measured. Animations must not run while this
   * is false, or the first frame is decided by the server's guess.
   */
  ready: boolean;
  /** The visitor asked for less motion. Honour it everywhere, no exceptions. */
  reducedMotion: boolean;
  /** A real pointer — cursor, hover plates and mouse parallax need this. */
  finePointer: boolean;
  /**
   * The single question most call sites actually want: may I animate?
   * Ready, and not reduced.
   */
  animate: boolean;
  /**
   * May I run pointer-driven motion? Adds a fine pointer to the above, so
   * touch devices never pay for an effect they cannot trigger (§12, §29).
   */
  pointerMotion: boolean;
};

const CapabilityContext = createContext<Capability | null>(null);

export function CapabilityProvider({ children }: { children: React.ReactNode }) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const finePointer = useMediaQuery('(pointer: fine)');
  const hover = useMediaQuery('(hover: hover)');

  // `useSyncExternalStore` returns the server snapshot until hydration
  // completes, so the first client value doubles as the readiness signal.
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const value = useMemo<Capability>(() => {
    const animate = ready && !reducedMotion;
    return {
      ready,
      reducedMotion,
      finePointer: finePointer && hover,
      animate,
      pointerMotion: animate && finePointer && hover,
    };
  }, [ready, reducedMotion, finePointer, hover]);

  return <CapabilityContext.Provider value={value}>{children}</CapabilityContext.Provider>;
}

/**
 * Throws outside the provider rather than returning a permissive default:
 * a section animating because it could not find the provider is exactly the
 * failure this module exists to prevent.
 */
export function useCapability(): Capability {
  const ctx = useContext(CapabilityContext);
  if (!ctx) throw new Error('useCapability must be used inside <CapabilityProvider>.');
  return ctx;
}
