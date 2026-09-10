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

  const [height, setHeight] = useState(600);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIdRef = useRef<string | null>(null);

  /** Deal the photographs across the columns, round robin. */
  const columnItems = useMemo(() => {
    const cols: DriftItem[][] = Array.from({ length: columns }, () => []);
    items.forEach((item, i) => cols[i % columns].push(item));
    return cols.map((col) => (col.length ? col : items.slice(0, 1)));
  }, [items, columns]);

  /**
   * How tall one repeat of a column is, and how many repeats it takes to
   * cover the frame. Two is the floor: one to show and one to follow it up,
   * or the loop has a gap in it at the seam.
   */
  const columnMeta = useMemo(() => {
    const unit = tileHeight + gap;
    return columnItems.map((col) => {
      const copyHeight = Math.max(unit, col.length * unit);
      return { copyHeight, copies: Math.max(2, Math.ceil((height * 1.6) / copyHeight) + 1) };
    });
  }, [columnItems, tileHeight, gap, height]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setHeight(entry.contentRect.height || 600));
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
        '--dw-tile-w': `${tileWidth}px`,
        '--dw-tile-h': `${tileHeight}px`,
        '--dw-gap': `${gap}px`,
        '--dw-radius': `${radius}px`,
        '--dw-perspective': `${perspective}px`,
        '--dw-lift': `${lift}px`,
        '--dw-dim': dim,
        '--dw-gray': grayscale ? 1 : 0,
        '--dw-overlay': overlayColor,
        '--dw-edge': `${Math.max(0, (1 - fade) * 100)}%`,
      }) as React.CSSProperties,
    [tileWidth, tileHeight, gap, radius, perspective, lift, dim, grayscale, overlayColor, fade]
  );

  const renderTile = (item: DriftItem, id: string, col: number) => {
    const meta = IMAGES[item.slug];
    const inner = (
      <span className="drift-wall__inner">
        <picture>
          <source type="image/avif" srcSet={srcSet(item.slug, 'avif')} sizes={sizes} />
          <source type="image/webp" srcSet={srcSet(item.slug, 'webp')} sizes={sizes} />
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

    const common = {
      className: cn('drift-wall__tile', activeId === id && 'is-active'),
      'data-tile-id': id,
      'data-col': col,
      onFocus: () => activate(id, col),
      onBlur: release,
    };

    if (item.href) {
      return (
        <a key={id} href={item.href} target="_blank" rel="noreferrer noopener" {...common}>
          {inner}
        </a>
      );
    }
    // Not a button: it does nothing when pressed. It is focusable only so a
    // keyboard can bring a frame forward and read its alt text.
    return (
      <div key={id} tabIndex={0} aria-label={item.title ?? meta.alt} {...common}>
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
                col.map((item, i) => renderTile(item, `${c}-${copy}-${i}`, c))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
