import { cn } from '@/lib/utils';

/**
 * The VAPR seal, redrawn as vector from the supplied artwork on a 200×200
 * field centred on (100,100).
 *
 * ── Why this is vector and not the PNG ──────────────────────────────────
 * The mark is not decoration here, it is a moving part. The entry sequence
 * draws it stroke by stroke with `stroke-dashoffset`, which needs real path
 * geometry — a raster cannot be drawn on. It also has to take its colour from
 * whatever it sits in (`currentColor`), sit on black without a matte, and stay
 * crisp from 32px in the navigation to 480px as a frontispiece. One file,
 * about 4kB, does all of that.
 *
 * ── What it is, structurally ────────────────────────────────────────────
 * Four-fold symmetry throughout, built outward from the centre:
 *
 *   · the ring, with a quatrefoil at each cardinal point
 *   · a diamond whose vertices reach most of the way to the ring, each vertex
 *     carrying its own quatrefoil
 *   · a chevron run outside every diamond edge and a run of dots inside it
 *   · a fletched rule along each diagonal, ending in a squared ornament just
 *     inside the ring
 *   · four fans around the centre — spoked on one diagonal, concentric arcs
 *     on the other, which is the one place the symmetry is deliberately broken
 *   · the wordmark across the middle, breaking the diamond's waist
 *
 * ── Fidelity ────────────────────────────────────────────────────────────
 * This is a careful reconstruction traced from the raster, not a conversion of
 * the original vector. The proportions, ornament placement and stroke weights
 * are matched by eye against the artwork; the fine interior detail of the
 * corner ornaments is simplified, because below about 120px it turns to mush
 * either way. If the original AI/EPS/SVG exists, dropping it in is strictly
 * better than this and the swap is a small one.
 */

/** Four semicircular lobes about the origin — the seal's repeating flower. */
const quatrefoil = (r: number) =>
  `M${-r},${-r} A${r},${r} 0 0 1 ${r},${-r} A${r},${r} 0 0 1 ${r},${r} ` +
  `A${r},${r} 0 0 1 ${-r},${r} A${r},${r} 0 0 1 ${-r},${-r} Z`;

/** A chevron run of `n` peaks, `w` wide and `h` tall, centred on the origin. */
function chevron(n: number, w: number, h: number) {
  const span = n * w;
  let d = `M${-span / 2},0`;
  for (let i = 0; i < n; i += 1) d += ` l${w / 2},${-h} l${w / 2},${h}`;
  return d;
}

/**
 * A fletched rule running outward along +x, from `from` to `to`.
 * The three bars behind the head are the seal's most recognisable detail.
 */
function ArrowRule({ from, to }: { from: number; to: number }) {
  const bars = [0, 4.5, 9].map((back, i) => {
    const x = to - 5 - back;
    const half = 4 - i * 0.8;
    return `M${x},${-half} V${half}`;
  });
  return (
    <g>
      <path d={`M${from},0 H${to}`} />
      <path d={`M${to},0 l-5.5,-3.2 M${to},0 l-5.5,3.2`} />
      <path d={bars.join(' ')} />
    </g>
  );
}

/**
 * A half fan of fine rays, drawn about the origin and sweeping 180°.
 * Semicircular rather than quarter: the artwork's fans are half-discs, and a
 * quarter reads as a shell rather than as a rising sun.
 */
function RayFan({ r = 17 }: { r?: number }) {
  return (
    <g>
      <path d={`M${-r},0 A${r},${r} 0 0 1 ${r},0`} />
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M0,0 L${r - 1.2},0`} transform={`rotate(${-180 + i * 22.5})`} />
      ))}
    </g>
  );
}

/** A half fan of concentric arcs. Sits on the other diagonal pair. */
function ArcFan({ r = 17 }: { r?: number }) {
  return (
    <g>
      {[r, r * 0.74, r * 0.48, r * 0.22].map((rr) => (
        <path key={rr} d={`M${-rr},0 A${rr},${rr} 0 0 1 ${rr},0`} />
      ))}
    </g>
  );
}

/** The squared ornament that terminates each diagonal, just inside the ring. */
function CornerBlock() {
  return (
    <g>
      <path d="M-5.6,-5.6 H5.6 V5.6 H-5.6 Z" />
      <path d={quatrefoil(2.5)} />
    </g>
  );
}

/** A run of dots along +x, inside a diamond edge. */
function DotRun({ count = 6, gap = 9 }: { count?: number; gap?: number }) {
  const span = (count - 1) * gap;
    return (
    <g>
      {Array.from({ length: count }, (_, i) => (
        <circle
          key={i}
          cx={-span / 2 + i * gap}
          cy={0}
          r={1.1}
          fill="currentColor"
          strokeWidth={0}
        />
      ))}
    </g>
  );
}

export type EmblemProps = {
  className?: string;
  /**
   * `full` is the complete seal with the wordmark inside it — the logo as
   * supplied. `mark` drops the wordmark, for the two places where the word
   * VAPR is already set beside or beneath the seal and would otherwise appear
   * twice. `simple` keeps only the ring, the diamond and the cardinal
   * quatrefoils, because below roughly 60px the hairline detail turns to mush
   * and the mark stops reading as anything at all.
   */
  variant?: 'full' | 'mark' | 'simple';
  title?: string;
  /** Adds the classes the entry sequence draws against. */
  animated?: boolean;
};

/** Geometry constants, so the ornaments and the diamond cannot drift apart. */
const RING = 94;
/** Half-diagonal of the diamond. Its vertices reach two-thirds to the ring. */
const D = 62;
/** Centre of each diamond edge, at 45° between two vertices. */
const EDGE = D / 2;

export default function Emblem({
  className,
  variant = 'full',
  title,
  animated = false,
}: EmblemProps) {
  const line = animated ? 'emblem-line' : undefined;

  if (variant === 'simple') {
    return (
      <svg
        viewBox="0 0 200 200"
        className={cn('h-auto w-full', className)}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinejoin="round"
        role={title ? 'img' : 'presentation'}
        aria-hidden={title ? undefined : true}
        aria-label={title}
      >
        {title ? <title>{title}</title> : null}
        <circle cx={100} cy={100} r={RING} />
        <path d={`M100,${100 - D} L${100 + D},100 L100,${100 + D} L${100 - D},100 Z`} />
        {[0, 90, 180, 270].map((a) => (
          <g key={a} transform={`rotate(${a} 100 100) translate(100 ${100 - RING + 8})`}>
            <path d={quatrefoil(7)} strokeWidth={0} fill="currentColor" />
          </g>
        ))}
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 200 200"
      className={cn('h-auto w-full', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}

      {/* ── The ring, and the flower at each cardinal point. ─────────────── */}
      <g className={line} data-emblem="ring">
        <circle cx={100} cy={100} r={RING} strokeWidth={1.3} />
      </g>
      <g className={line} data-emblem="ring-foils">
        {[0, 90, 180, 270].map((a) => (
          // Inset from the ring rather than centred on it: a quatrefoil of
          // radius r extends r·√2 from its own centre, which at r = RING put
          // its outer lobe past the edge of the viewBox and sheared it flat.
          <g key={a} transform={`rotate(${a} 100 100) translate(100 ${100 - RING + 7})`}>
            <path d={quatrefoil(5) } />
            <circle cx={0} cy={0} r={1.3} fill="currentColor" strokeWidth={0} />
          </g>
        ))}
      </g>

      {/* ── The diagonals: a fletched rule out to a squared ornament. ────── */}
      <g className={line} data-emblem="rules">
        {[45, 135, 225, 315].map((a) => (
          <g key={a} transform={`rotate(${a} 100 100) translate(100 100)`}>
            <ArrowRule from={28} to={66} />
            <g transform="translate(79 0)">
              <CornerBlock />
            </g>
          </g>
        ))}
      </g>

      {/* ── The diamond. ────────────────────────────────────────────────── */}
      <g className={line} data-emblem="diamond">
        <path
          d={`M100,${100 - D} L${100 + D},100 L100,${100 + D} L${100 - D},100 Z`}
          strokeWidth={1.2}
        />
      </g>

      {/*
        Every edge carries a chevron run outside it and a run of dots inside.
        Placed by rotating onto each edge rather than by writing four sets of
        coordinates, so the diamond can be resized from `D` alone.
      */}
      <g className={line} data-emblem="edges">
        {[
          { at: [100 + EDGE, 100 - EDGE], rot: 45 },
          { at: [100 + EDGE, 100 + EDGE], rot: 135 },
          { at: [100 - EDGE, 100 + EDGE], rot: 225 },
          { at: [100 - EDGE, 100 - EDGE], rot: 315 },
        ].map(({ at, rot }) => (
          <g key={rot} transform={`translate(${at[0]} ${at[1]}) rotate(${rot})`}>
            {/* Outward of the edge is −y once rotated into place. */}
            {/* The edge is D·√2 ≈ 88 long; the run is kept to 60 so it
                stops clear of the quatrefoil sitting on each vertex. */}
            <g transform="translate(0 -6)">
              <path d={chevron(10, 6, 2.6)} />
            </g>
            <g transform="translate(0 6.5)">
              <DotRun count={7} gap={8} />
            </g>
          </g>
        ))}
      </g>

      {/* ── A flower on each diamond vertex. ────────────────────────────── */}
      <g className={line} data-emblem="vertex-foils">
        {[0, 90, 180, 270].map((a) => (
          <g key={a} transform={`rotate(${a} 100 100) translate(100 ${100 - D})`}>
            <path d={quatrefoil(4.6)} />
          </g>
        ))}
      </g>

      {/*
        The four fans. Spoked on one diagonal, concentric arcs on the other —
        the single place the mark's four-fold symmetry is broken, and the
        detail that stops it reading as a compass rose.

        Placed on the diagonals at a third of the radius, each turned so its
        flat diameter faces the centre and the dome opens outward. They were
        first laid out near the middle on the cardinal axes, which put all four
        of them straight across the band the wordmark occupies — VAPR was
        printed over a sunburst and neither survived.
      */}
      <g className={line} data-emblem="fans">
        {[45, 225].map((a) => (
          <g key={a} transform={`translate(100 100) rotate(${a}) translate(30 0) rotate(90)`}>
            <RayFan r={14} />
          </g>
        ))}
        {[135, 315].map((a) => (
          <g key={a} transform={`translate(100 100) rotate(${a}) translate(30 0) rotate(90)`}>
            <ArcFan r={14} />
          </g>
        ))}
      </g>

      {variant === 'full' ? (
        <text
          x={100}
          y={100}
          textAnchor="middle"
          dominantBaseline="central"
          stroke="none"
          fill="currentColor"
          className={cn('font-[family-name:var(--font-display)]', animated && 'emblem-word')}
          style={{ fontSize: 29, letterSpacing: '0.06em' }}
        >
          VAPR
        </text>
      ) : null}
    </svg>
  );
}
