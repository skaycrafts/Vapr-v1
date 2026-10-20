'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { useCapability } from '@/motion/capability';
import { IMAGES, srcSet, fallbackSrc, type ImageSlug } from '@/lib/media';
import { cn } from '@/lib/utils';

/**
 * DriftWall — a perspective wall of photographs, drifting column by column.
 *
 * Adapted from the React Bits component of the same name. The geometry, the
 * prop names and the column mathematics are theirs; four things had to change
 * for it to belong in this project rather than merely run in it.
 *
 *  1. IT TAKES SLUGS, NOT URLS. The original renders `<img src={item.image}>`.
 *     Every photograph here has AVIF and WebP renditions at four widths and a
 *     base64 LQIP, all in the generated manifest, and a wall of twenty raw
 *     JPEGs would have been the single heaviest thing on the site. Items are
 *     manifest slugs now, the tile renders a `<picture>`, and the alt text
 *     comes off the manifest rather than being invented at the call site.
 *
 *  2. ONE TICKER. The original owns a `requestAnimationFrame` loop. This site
 *     drives Lenis and every ScrollTrigger from `gsap.ticker`, and a second
 *     independent loop is how you get two animation clocks disagreeing under
 *     load. It subscribes to the shared ticker instead.
 *
 *  3. ONE SOURCE OF TRUTH FOR MOTION. The original runs its own
 *     `matchMedia('(prefers-reduced-motion)')` listener. `CapabilityProvider`
 *     already answers that question for the whole site, and also answers
 *     whether there is a pointer worth parallaxing for — so a touch device no
 *     longer pays for a pointer effect it cannot trigger.
 *
 *  4. IT TAKES ITS COLOUR FROM THE GROUND. The original tints resting tiles
 *     with a hard-coded `#060010`, a purple-black that belongs to another
 *     palette. The tint is the section's own ground colour here, so the wall
 *     works on both the ink and the paper sections without being told which
 *     it is standing on.
 *
 * Reduced motion keeps the wall — it is photography, and hiding it would cost
 * the content — but freezes the drift and the pointer tilt, which is the part
 * that is motion rather than picture.
 */

export type DriftItem = {
  slug: ImageSlug;
  /** Overrides the manifest's alt. Rarely wanted. */
  title?: string;
  href?: string;
};

export type DriftWallProps = {
  items: readonly DriftItem[];
  columns?: number;
  /**
   * Columns below `narrowAt`. Five columns of a 390px screen are 68px wide,
   * which is a wall of texture and not a photograph of anything; three are
   * half as wide again and still read as a grid.
   */
  narrowColumns?: number;
  /** The width at which the wall drops to `narrowColumns`. */
  narrowAt?: number;
  tileWidth?: number;
  tileHeight?: number;
  gap?: number;
  radius?: number;
  /** Perspective pitch (rotateX, degrees). */
  tilt?: number;
  /** Perspective yaw (rotateY, degrees). */
  turn?: number;
  /** In-plane rotation (rotateZ, degrees). */
  roll?: number;
  perspective?: number;
  depth?: number;
  /** Base drift in pixels per second. */
  speed?: number;
  direction?: 'up' | 'down';
  /** How much column speeds differ (0–1). */
  variance?: number;
  /** Pointer-follow tilt strength; 0 disables. */
  parallax?: number;
  pauseOnHover?: boolean;
  /** How far a hovered tile lifts toward the viewer, in pixels. */
  lift?: number;
  /** Edge and depth dissolve (0–1). */
  fade?: number;
  /** Resting opacity of unhovered tiles (0–1). */
  dim?: number;
  grayscale?: boolean;
  /** Tint over resting tiles. Defaults to the section's own ground. */
  overlayColor?: string;
  className?: string;
  sizes?: string;
};

/**
 * A stable per-column speed multiplier.
 *
 * The golden-ratio stride is the original's, and it is the right trick: it
 * spreads the columns across the range without repeating for any realistic
 * column count, and it is pure — the same column always drifts at the same
 * rate, so nothing shifts between server and client render.
 */
const columnFactor = (index: number, variance: number) => {
  const pseudo = ((index * 0.618_033_988_7 + 0.35) % 1) * 2 - 1;
  return 1 + variance * pseudo;
};

export default function DriftWall({
  items,
  columns = 5,
  narrowColumns = 3,
  narrowAt = 640,
  tileWidth = 200,
  tileHeight = 132,
  gap = 18,
  radius = 14,
  tilt = 16,
  turn = -14,
  roll = 0,
  perspective = 1200,
  depth = 120,
  speed = 42,
  direction = 'up',
  variance = 0.45,
  parallax = 0.6,
  pauseOnHover = false,
  lift = 64,
  fade = 0.6,
  dim = 0.55,
  grayscale = false,
  overlayColor = 'var(--color-paper)',
  className,
  sizes = '200px',
}: DriftWallProps) {
  const { animate, pointerMotion } = useCapability();

  const containerRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const trackRefs = useRef<(HTMLDivElement | null)[]>([]);

  const offsets = useRef<number[]>([]);
  const velocities = useRef<number[]>([]);
  const hoveredCol = useRef(-1);
  const wallHovered = useRef(false);
  const pointer = useRef({ x: 0, y: 0 });
  const damped = useRef({ x: 0, y: 0 });

  const [size, setSize] = useState({ width: 1200, height: 600 });
  const { height } = size;
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIdRef = useRef<string | null>(null);

  /**
   * Tile size, scaled so every column fits the frame it is in.
   *
   * `tileWidth` and `tileHeight` were absolute pixels, which made the wall a
   * fixed 1090px across whatever it was shown in. On a laptop that is a wall
   * of five columns; on a 390px phone it is nearly three screens wide, so a
   * visitor saw one column magnified and no wall at all.
   *
   * They are a maximum now. The plane carries a constant `scale(1.18)` and
   * sits at a slight yaw, so the width it really occupies is a little more
   * than the sum of its columns; `PLANE_SPREAD` is that, measured, and the
   * 0.98 leaves a hair of air at the sides. The aspect ratio and the gap
   * scale with the tile, so the composition is the same picture at every
   * size rather than a different one.
   */
  /**
   * How many columns this screen gets.
   *
   * Fitting five columns to a phone works — every column is on screen — but
   * at 68px a tile the photographs stop being photographs. Three columns at
   * the same width are 99px, which still reads as a wall and lets a frame be
   * seen. The deal, the loop and the fit all key off this rather than the
   * prop, so a resize across the threshold re-deals the whole wall.
   */
  const cols = size.width > 0 && size.width < narrowAt ? Math.min(columns, narrowColumns) : columns;

  const fit = useMemo(() => {
    const PLANE_SPREAD = 1.18;
    const natural = cols * (tileWidth + gap) * PLANE_SPREAD;
    return Math.min(1, (size.width * 0.98) / natural);
  }, [cols, tileWidth, gap, size.width]);

  const tileW = Math.round(tileWidth * fit);
  const tileH = Math.round(tileHeight * fit);
  const tileGap = Math.max(4, Math.round(gap * fit));

  /** Deal the photographs across the columns, round robin. */
  const columnItems = useMemo(() => {
    const dealt: DriftItem[][] = Array.from({ length: cols }, () => []);
    items.forEach((item, i) => dealt[i % cols].push(item));
    return dealt.map((col) => (col.length ? col : items.slice(0, 1)));
  }, [items, cols]);

  /**
   * How tall one repeat of a column is, and how many repeats it takes to
   * cover the frame. Two is the floor: one to show and one to follow it up,
   * or the loop has a gap in it at the seam.
   */
  const columnMeta = useMemo(() => {
    const unit = tileH + tileGap;
    return columnItems.map((col) => {
      const copyHeight = Math.max(unit, col.length * unit);
      return { copyHeight, copies: Math.max(2, Math.ceil((height * 1.6) / copyHeight) + 1) };
    });
  }, [columnItems, tileH, tileGap, height]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width || 1200,
        height: entry.contentRect.height || 600,
      })
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const baseVelocities = useMemo(() => {
    const dirSign = direction === 'up' ? 1 : -1;
    return columnItems.map((_, c) => {
      const altSign = c % 2 === 0 ? 1 : -1;
      return speed * columnFactor(c, variance) * dirSign * altSign;
    });
  }, [columnItems, speed, direction, variance]);

  // Stagger the columns' starting offsets so the wall never begins in a row.
  useEffect(() => {
    offsets.current = columnMeta.map((meta, c) => meta.copyHeight * ((c * 0.37) % 1));
    velocities.current = columnItems.map(() => 0);
  }, [columnMeta, columnItems]);

  const applyPlane = useCallback(
    (px: number, py: number) => {
      const plane = planeRef.current;
      if (!plane) return;
      plane.style.transform =
        `translate(-50%, -50%) scale(1.18) ` +
        `rotateX(${tilt + py}deg) rotateY(${turn + px}deg) rotateZ(${roll}deg) ` +
        `translateZ(${-depth}px)`;
    },
    [tilt, turn, roll, depth]
  );

  /**
   * The loop, on the shared ticker.
   *
   * `deltaTime` arrives in milliseconds and is clamped: a backgrounded tab
   * returns with a delta of several seconds, and without the clamp every
   * column would jump most of a repeat on the frame it came back.
   */
  useEffect(() => {
    const tick = (_t: number, deltaMs: number) => {
      const dt = Math.min(0.05, Math.max(0, deltaMs) / 1000);

      const maxTilt = parallax * 8;
      const tx = pointer.current.x * maxTilt;
      const ty = -pointer.current.y * maxTilt;
      const damp = 1 - Math.exp(-dt / 0.12);
      damped.current.x += (tx - damped.current.x) * damp;
      damped.current.y += (ty - damped.current.y) * damp;
      applyPlane(damped.current.x, damped.current.y);

      for (let c = 0; c < trackRefs.current.length; c += 1) {
        const meta = columnMeta[c];
        const el = trackRefs.current[c];
        if (!meta || !el) continue;

        if (animate) {
          const paused = wallHovered.current && pauseOnHover;
          const target = paused || hoveredCol.current === c ? 0 : baseVelocities[c];
          const ease = 1 - Math.exp(-dt / (target === 0 ? 0.16 : 0.28));
          velocities.current[c] += (target - velocities.current[c]) * ease;

          let next = (offsets.current[c] ?? 0) + velocities.current[c] * dt;
          next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
          offsets.current[c] = next;
        }

        el.style.transform = `translate3d(0, ${-(offsets.current[c] ?? 0)}px, 0)`;
      }
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
    };
  }, [animate, applyPlane, baseVelocities, columnMeta, parallax, pauseOnHover]);

  const activate = useCallback((id: string, col: number) => {
    activeIdRef.current = id;
    hoveredCol.current = col;
    setActiveId(id);
  }, []);

  const release = useCallback(() => {
    activeIdRef.current = null;
    hoveredCol.current = -1;
    setActiveId(null);
  }, []);

  /**
   * One listener on the wall rather than per tile.
   *
   * The tiles are `pointer-events: none` inside — the lift transform would
   * otherwise make a tile chase the cursor in and out of its own hit box —
   * so which tile is under the pointer is resolved by hit-testing.
   */
  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      if (parallax > 0 && pointerMotion) {
        pointer.current = {
          x: (e.clientX - rect.left) / rect.width - 0.5,
          y: (e.clientY - rect.top) / rect.height - 0.5,
        };
      }

      const hit = document.elementFromPoint(e.clientX, e.clientY);
      const tile = hit?.closest<HTMLElement>('[data-tile-id]');
      if (!tile) return;
      const id = tile.dataset.tileId;
      if (!id || id === activeIdRef.current) return;
      activate(id, Number(tile.dataset.col));
    },
    [parallax, pointerMotion, activate]
  );

  const onPointerLeave = useCallback(() => {
    wallHovered.current = false;
    pointer.current = { x: 0, y: 0 };
    release();
  }, [release]);

  const cssVars = useMemo(
    () =>
      ({
        '--dw-tile-w': `${tileW}px`,
        '--dw-tile-h': `${tileH}px`,
        '--dw-gap': `${tileGap}px`,
        '--dw-radius': `${radius}px`,
        '--dw-perspective': `${perspective}px`,
        '--dw-lift': `${lift}px`,
        '--dw-dim': dim,
        '--dw-gray': grayscale ? 1 : 0,
        '--dw-overlay': overlayColor,
        '--dw-edge': `${Math.max(0, (1 - fade) * 100)}%`,
      }) as React.CSSProperties,
    [tileW, tileH, tileGap, radius, perspective, lift, dim, grayscale, overlayColor, fade]
  );

  const tileSizes = tileW > 0 ? `${tileW}px` : sizes;

  const renderTile = (item: DriftItem, id: string, col: number, copy: number) => {
    const meta = IMAGES[item.slug];
    const inner = (
      <span className="drift-wall__inner">
        <picture>
          {/* The measured tile, not a guess: the fitted width is known by the
              time anything paints, and a `sizes` written for the desktop tile
              had phones downloading frames three times the size they drew. */}
          <source type="image/avif" srcSet={srcSet(item.slug, 'avif')} sizes={tileSizes} />
          <source type="image/webp" srcSet={srcSet(item.slug, 'webp')} sizes={tileSizes} />
          <img
            src={fallbackSrc(item.slug)}
            alt={item.title ?? meta.alt}
            width={meta.width}
            height={meta.height}
            loading="lazy"
            decoding="async"
            draggable={false}
            style={{ backgroundImage: `url(${meta.lqip})` }}
          />
        </picture>
        <span className="drift-wall__overlay" aria-hidden />
      </span>
    );

    /**
     * Every photograph is in the DOM at least twice — the loop needs a second
     * copy of each column to run without a seam — so only the first copy is
     * exposed. Without this a screen reader read the same twenty alt texts
     * two and three times over, as though the hotel had sixty rooms.
     */
    const common = {
      className: cn('drift-wall__tile', activeId === id && 'is-active'),
      'data-tile-id': id,
      'data-col': col,
      ...(copy > 0 ? { 'aria-hidden': true } : {}),
      onFocus: () => activate(id, col),
      onBlur: release,
    };

    // A linked tile, but only the copy that is actually exposed. A hidden
    // copy rendered as a link would be focusable and `aria-hidden` at once,
    // which is the one combination that is worse than either.
    if (item.href && copy === 0) {
      return (
        <a key={id} href={item.href} target="_blank" rel="noreferrer noopener" {...common}>
          {inner}
        </a>
      );
    }
    /**
     * Not focusable.
     *
     * It carried `tabIndex={0}` so a keyboard could bring a frame forward and
     * hear its alt text. The wall holds twenty photographs across five
     * columns, each column doubled for the loop — so that was forty tab stops
     * between the specification sheet and the enquiry, on a decoration that
     * does nothing when pressed. The photographs and their descriptions are
     * still in the accessibility tree, where a screen reader reads them
     * without anyone having to step through them one at a time.
     */
    return (
      <div key={id} {...common}>
        {inner}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={cn('drift-wall', !animate && 'drift-wall--reduced', className)}
      style={cssVars}
      onPointerMove={onPointerMove}
      onPointerEnter={() => {
        wallHovered.current = true;
      }}
      onPointerLeave={onPointerLeave}
      role="group"
      aria-label="Photographs from the hotel"
    >
      <div ref={planeRef} className="drift-wall__plane">
        {columnItems.map((col, c) => (
          <div className="drift-wall__col" key={`col-${c}`}>
            <div
              className="drift-wall__track"
              ref={(el) => {
                trackRefs.current[c] = el;
              }}
            >
              {Array.from({ length: columnMeta[c].copies }).map((_, copy) =>
                col.map((item, i) => renderTile(item, `${c}-${copy}-${i}`, c, copy))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
