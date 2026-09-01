/**
 * Two fixed overlays that sit above everything and take no input:
 *
 *  - a tiled fractal-noise tile, shifted on a step timer so the grain
 *    resettles rather than crawling, and
 *  - a soft vignette that keeps the corners from competing with the type.
 *
 * Both are pure paint on the compositor — no per-frame JavaScript — so they
 * cost nothing during scroll. The noise tile is inlined as a data URI to
 * avoid a request for 400 bytes.
 */

const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.42'/%3E%3C/svg%3E")`;

export default function FilmGrain() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[var(--z-overlay)] opacity-[0.055] mix-blend-overlay motion-safe:animate-[grain_1.2s_steps(6)_infinite]"
        style={{ backgroundImage: NOISE, backgroundSize: '180px 180px' }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[var(--z-overlay)]"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 45%, transparent 42%, color-mix(in oklab, var(--color-void) 62%, transparent) 100%)',
        }}
      />
      <style>{`
        @keyframes grain {
          0%   { transform: translate3d(0, 0, 0); }
          16%  { transform: translate3d(-6%, 4%, 0); }
          33%  { transform: translate3d(4%, -7%, 0); }
          50%  { transform: translate3d(-8%, -3%, 0); }
          66%  { transform: translate3d(7%, 6%, 0); }
          83%  { transform: translate3d(-3%, 8%, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
      `}</style>
    </>
  );
}
