'use client';

import { useEffect, useState } from 'react';

export type Capability = {
  /** Resolved on the client; `null` until then so SSR and hydration agree. */
  ready: boolean;
  reducedMotion: boolean;
  /** Whether the device should be asked to run the shader work. */
  webgl: boolean;
  coarsePointer: boolean;
};

/**
 * Decides whether this device gets the WebGL treatment.
 *
 * The rule is conservative: reduced motion, a missing context, or an obviously
 * modest device all fall back to the plain photograph. That is not a degraded
 * experience — it is the same picture without the dissolve.
 */
export function useCapability(): Capability {
  const [state, setState] = useState<Capability>({
    ready: false,
    reducedMotion: false,
    webgl: false,
    coarsePointer: false,
  });

  useEffect(() => {
    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarseQuery = window.matchMedia('(pointer: coarse)');

    const hasContext = () => {
      try {
        const canvas = document.createElement('canvas');
        return Boolean(
          canvas.getContext('webgl2') ??
            canvas.getContext('webgl') ??
            canvas.getContext('experimental-webgl')
        );
      } catch {
        return false;
      }
    };

    const evaluate = () => {
      const reducedMotion = reduceQuery.matches;
      const coarsePointer = coarseQuery.matches;
      const cores = navigator.hardwareConcurrency ?? 4;
      const modest = coarsePointer && cores <= 4;
      setState({
        ready: true,
        reducedMotion,
        coarsePointer,
        webgl: !reducedMotion && !modest && hasContext(),
      });
    };

    evaluate();
    reduceQuery.addEventListener('change', evaluate);
    coarseQuery.addEventListener('change', evaluate);
    return () => {
      reduceQuery.removeEventListener('change', evaluate);
      coarseQuery.removeEventListener('change', evaluate);
    };
  }, []);

  return state;
}
