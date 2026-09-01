import { cn } from '@/lib/utils';

/**
 * A vector reconstruction of the VAPR seal, drawn on a 200x200 field centred
 * on (100,100). Built from paths rather than the supplied raster so it can be
 * drawn on with `stroke-dashoffset`, tinted, and scaled without artefacts.
 *
 * The geometry has 4-fold rotational symmetry, with the corner fans
 * alternating between rays and arcs on the diagonal — same as the original.
 */

const QUATREFOIL =
  'M0,-5 a3.6,3.6 0 0 1 5,5 a3.6,3.6 0 0 1 -5,5 a3.6,3.6 0 0 1 -5,-5 a3.6,3.6 0 0 1 5,-5 Z';

/** A fletched rule running out along a diagonal. */
function ArrowRule() {
  return (
    <g>
      <path d="M-52,0 H44" />
      {/* fletching */}
      <path d="M44,0 l-7,-4 M44,0 l-7,4 M40,-5 v10 M36,-4 v8 M32,-3 v6" />
      <g transform="translate(-52,0)">
        <path d={QUATREFOIL} transform="scale(0.85)" />
      </g>
    </g>
  );
}

/** The wave that shadows each arrow. */
function WaveRule() {
  const seg = 'q 3,-4 6,0 t 6,0';
  return <path d={`M-40,0 ${seg} ${seg} ${seg} ${seg} ${seg} ${seg} ${seg} ${seg}`} />;
}

function RayFan() {
  return (
    <g>
      <path d="M0,0 a18,18 0 0 1 18,18 L0,18 Z" fill="none" />
      {[0, 15, 30, 45, 60, 75, 90].map((a) => (
        <path key={a} d="M0,0 L17,0" transform={`rotate(${a})`} />
      ))}
    </g>
  );
}

function ArcFan() {
  return (
    <g>
      {[8, 12.5, 17].map((r) => (
        <path key={r} d={`M${r},0 A${r},${r} 0 0 1 0,${r}`} />
      ))}
    </g>
  );
}

function DotRun({ count = 5 }: { count?: number }) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => (
        <circle key={i} cx={40 + i * 7} cy={0} r={1.15} strokeWidth={0} fill="currentColor" />
      ))}
    </g>
  );
}

export type EmblemProps = {
  className?: string;
  /**
   * `full` is the complete seal with the wordmark; `mark` drops the wordmark
   * for large decorative use; `simple` keeps only the ring, the diamond and
   * the cardinal quatrefoils, because below roughly 60px the hairline detail
   * turns to mush and the mark stops reading as anything at all.
   */
  variant?: 'full' | 'mark' | 'simple';
  title?: string;
  /** Adds the classes the preloader animates against. */
  animated?: boolean;
};

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
        strokeWidth={2.6}
        strokeLinejoin="round"
        role={title ? 'img' : 'presentation'}
        aria-hidden={title ? undefined : true}
        aria-label={title}
      >
        {title ? <title>{title}</title> : null}
        <circle cx={100} cy={100} r={94} />
        <path d="M100,30 L170,100 L100,170 L30,100 Z" />
        {[0, 90, 180, 270].map((a) => (
          <g key={a} transform={`rotate(${a} 100 100) translate(100 100)`}>
            <path d="M0,-52 a9,9 0 0 1 0,18 a9,9 0 0 1 0,-18 Z" strokeWidth={0} fill="currentColor" />
          </g>
        ))}
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 200 200"
      className={cn('h-auto w-full overflow-visible', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={0.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}

      <g className={line} data-emblem="ring">
        <circle cx={100} cy={100} r={96} />
      </g>

      {/* Cardinal quatrefoils, sitting on the ring. */}
      <g className={line} data-emblem="foils">
        {[0, 90, 180, 270].map((a) => (
          <g key={a} transform={`rotate(${a} 100 100) translate(100 4)`}>
            <path d={QUATREFOIL} />
          </g>
        ))}
      </g>

      {/* Diagonal arrows, waves and dot runs. */}
      <g className={line} data-emblem="rays">
        {[45, 135, 225, 315].map((a) => (
          <g key={a} transform={`rotate(${a} 100 100) translate(100 100)`}>
            <g transform="translate(0,-9)">
              <ArrowRule />
            </g>
            <g transform="translate(0,7)">
              <WaveRule />
            </g>
          </g>
        ))}
      </g>

      <g className={line} data-emblem="dots">
        {[0, 90, 180, 270].map((a) => (
          <g key={a} transform={`rotate(${a} 100 100) translate(100 100)`}>
            <DotRun />
          </g>
        ))}
      </g>

      {/* The diamond that frames the wordmark. */}
      <g className={line} data-emblem="diamond">
        <path d="M100,32 L168,100 L100,168 L32,100 Z" />
      </g>

      {/* Quatrefoils at the vertical vertices. */}
      <g className={line} data-emblem="vertices">
        {[
          [100, 32],
          [100, 168],
        ].map(([x, y]) => (
          <g key={y} transform={`translate(${x} ${y})`}>
            <path d={QUATREFOIL} transform="scale(0.8)" />
          </g>
        ))}
      </g>

      {/* Corner fans: rays on one diagonal, arcs on the other. */}
      <g className={line} data-emblem="fans">
        <g transform="translate(58 100) rotate(-90)">
          <RayFan />
        </g>
        <g transform="translate(142 100) rotate(90)">
          <RayFan />
        </g>
        <g transform="translate(126 84) rotate(90)">
          <ArcFan />
        </g>
        <g transform="translate(74 116) rotate(-90)">
          <ArcFan />
        </g>
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
          style={{ fontSize: 30, letterSpacing: '0.06em' }}
        >
          VAPR
        </text>
      ) : null}
    </svg>
  );
}
