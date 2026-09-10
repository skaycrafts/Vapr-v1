'use client';

import { useEffect, useMemo, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useCapability } from '@/motion/capability';
import { cn } from '@/lib/utils';

/**
 * DepthText — a word extruded into the page.
 *
 * Adapted from the React Bits component. The layer mathematics, the pointer
 * damping and the prop names are theirs. Four things changed for it to belong
 * in this project rather than merely run in it — the same four the drifting
 * wall needed, for the same reasons.
 *
 *  1. ONE TICKER. The original owns a `requestAnimationFrame` loop. Lenis and
 *     every ScrollTrigger here run off `gsap.ticker`, and a second clock is
 *     how they disagree under load. Its orbit is driven by the ticker's own
 *     elapsed time rather than a private `performance.now()` baseline.
 *
 *  2. ONE SOURCE OF TRUTH FOR MOTION. It ran two `matchMedia` queries of its
 *     own for reduced motion and for a fine pointer. `CapabilityProvider`
 *     already answers both for the whole site, and answers them reactively —
 *     the original read the preference once at mount and never noticed it
 *     changing.
 *
 *  3. COLOUR FROM TOKENS. Its defaults are `#f8fafc` on `#7c3aed`, a white
 *     face over violet. The violet belongs to another palette entirely. The
 *     face is the ground's own ink and the extrusion recedes into a mid grey,
 *     both from tokens, so it reads correctly on either ground.
 *
 *  4. THE TRACKING IS A PROP. It hard-codes `-0.065em`, which is right for
 *     the heavy geometric sans it was demoed with and wrong for anything
 *     else. Set on a Didone it closes the sidebearings until the hairlines
 *     touch. It defaults to near zero here and the call site chooses.
 *
 * Under reduced motion the word is still extruded — the depth is the design,
 * not the animation — and simply holds its resting angle.
 */

const MAX_LAYERS = 64;

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/**
 * Each layer's colour, easing from the face toward the depth tint.
 *
 * The square makes the falloff fast near the face and slow at the back, which
 * is what stops the extrusion reading as a flat grey slab: most of the visible
 * contrast is in the first few layers, where the eye actually looks.
 */
const layerColor = (face: string, depth: string, index: number, total: number) => {
  const progress = total <= 1 ? 1 : index / total;
  const eased = progress * progress;
  return `color-mix(in srgb, ${face} ${Math.round((1 - eased) * 72 + 4)}%, ${depth})`;
};

const rot = (x: number, y: number) => `rotateX(${x.toFixed(3)}deg) rotateY(${y.toFixed(3)}deg)`;

export type DepthTextProps = {
  text: string;
  layers?: number;
  /** Spacing between layers, in pixels. */
  depth?: number;
  faceColor?: string;
  depthColor?: string;
  /** Maximum pointer-driven rotation, in degrees. */
  tilt?: number;
  pointerTracking?: boolean;
  smoothing?: number;
  perspective?: number;
  autoOrbit?: boolean;
  /** Fallback orbit speed, in cycles per second. */
  orbitSpeed?: number;
  fontSize?: string;
  fontWeight?: number | string;
  fontFamily?: string;
  letterSpacing?: string;
  shadow?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export default function DepthText({
  text,
  layers = 34,
  depth = 2.4,
  faceColor = 'var(--color-ink)',
  depthColor = 'var(--color-graphite)',
  tilt = 7.5,
  pointerTracking = true,
  smoothing = 0.14,
  perspective = 900,
  autoOrbit = true,
  orbitSpeed = 0.35,
  fontSize = 'clamp(3rem, 12vw, 7rem)',
  fontWeight = 400,
  fontFamily = 'var(--font-serif)',
  letterSpacing = '-0.01em',
  shadow = true,
  className,
  style,
}: DepthTextProps) {
  const { animate, pointerMotion } = useCapability();

  const rootRef = useRef<HTMLSpanElement>(null);
  const stageRef = useRef<HTMLSpanElement>(null);

  const safeLayers = clamp(Math.round(Number(layers) || 1), 2, MAX_LAYERS);
  const safeDepth = clamp(Number(depth) || 0, 0, 12);
  const safeTilt = clamp(Number(tilt) || 0, 0, 12);
  const safeSmoothing = clamp(Number(smoothing) || 0.14, 0.02, 0.35);
  const safePerspective = clamp(Number(perspective) || 900, 300, 2000);
  const safeOrbitSpeed = clamp(Number(orbitSpeed) || 0, 0, 2);

  /** The angle it sits at when nothing is asking it to move. */
  const base = useMemo(() => ({ x: -safeTilt * 0.32, y: safeTilt * 0.42 }), [safeTilt]);

  const stack = useMemo(
    () =>
      Array.from({ length: safeLayers }, (_, i) => {
        const index = safeLayers - i;
        return {
          index,
          color: layerColor(faceColor, depthColor, index, safeLayers),
          transform: `translateZ(${-index * safeDepth}px)`,
        };
      }),
    [safeLayers, safeDepth, faceColor, depthColor]
  );

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const apply = (x: number, y: number) => {
      stage.style.transform = rot(x, y);
    };

    // The extrusion is the design; the movement is not. Reduced motion keeps
    // the word carved and stops it turning.
    if (!animate) {
      apply(base.x, base.y);
      return;
    }

    const track = pointerTracking && pointerMotion;
    const current = { ...base };
    const target = { ...base };
    let pointerActive = false;
    let elapsed = 0;

    const onMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointerActive = true;
      const x = clamp((event.clientX - (rect.left + rect.width / 2)) / (rect.width * 0.8), -1, 1);
      const y = clamp((event.clientY - (rect.top + rect.height / 2)) / (rect.height * 0.8), -1, 1);
      target.x = base.x - y * safeTilt;
      target.y = base.y + x * safeTilt;
    };

    const onLeave = () => {
      pointerActive = false;
      target.x = base.x;
      target.y = base.y;
    };

    if (track) {
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerleave', onLeave);
      window.addEventListener('blur', onLeave);
    }

    const tick = (_t: number, deltaMs: number) => {
      // Clamped: a backgrounded tab returns with a delta of seconds, and the
      // orbit would jump most of a cycle on the frame it came back.
      elapsed += Math.min(0.05, Math.max(0, deltaMs) / 1000);

      if ((!track || !pointerActive) && autoOrbit) {
        const orbit = elapsed * safeOrbitSpeed * Math.PI * 2;
        // A pointer that has simply gone idle gets a smaller drift than a
        // device that never had one, so the word does not appear to escape.
        const amount = track ? 0.18 : 0.55;
        target.x = base.x + Math.sin(orbit) * safeTilt * amount;
        target.y = base.y + Math.cos(orbit * 0.85) * safeTilt * amount;
      }

      current.x += (target.x - current.x) * safeSmoothing;
      current.y += (target.y - current.y) * safeSmoothing;
      apply(current.x, current.y);
    };

    apply(base.x, base.y);
    gsap.ticker.add(tick);

    return () => {
      if (track) {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerleave', onLeave);
        window.removeEventListener('blur', onLeave);
      }
      gsap.ticker.remove(tick);
    };
  }, [animate, autoOrbit, base, pointerMotion, pointerTracking, safeOrbitSpeed, safeSmoothing, safeTilt]);

  const rootStyle = {
    ...style,
    '--depth-text-perspective': `${safePerspective}px`,
    '--depth-text-font-size': fontSize,
    '--depth-text-font-weight': fontWeight,
    '--depth-text-font-family': fontFamily,
    '--depth-text-tracking': letterSpacing,
    '--depth-text-face-color': faceColor,
    '--depth-text-shadow': shadow
      ? `0 22px 34px color-mix(in srgb, ${depthColor} 36%, transparent)`
      : 'none',
  } as React.CSSProperties;

  return (
    <span ref={rootRef} className={cn('depth-text', className)} style={rootStyle}>
      <span ref={stageRef} className="depth-text__stage">
        {stack.map((layer) => (
          <span
            key={layer.index}
            aria-hidden
            className="depth-text__layer"
            style={{ color: layer.color, transform: layer.transform }}
          >
            {text}
          </span>
        ))}
        {/* The only copy that is not `aria-hidden` — the word is read once. */}
        <span className="depth-text__face">{text}</span>
      </span>
    </span>
  );
}
