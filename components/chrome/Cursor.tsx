'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useCapability } from '@/motion/capability';
import { damp } from '@/lib/utils';

/**
 * A hairline ring that trails the pointer — the same 1px weight the seal is
 * drawn in. Over anything carrying `data-cursor` it fills and takes that
 * element's label, so a region can say what it does before it is clicked.
 *
 * The ring and the label are separate layers: only the ring is scaled, so the
 * label always renders at its true size rather than as blown-up 2px text.
 *
 * Mounts only for fine pointers that have not asked for reduced motion, and
 * every target it decorates is a real focusable element underneath.
 */
export default function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  // Read once, centrally, and live: this used to run its own pair of
  // `matchMedia` calls at mount, which meant a visitor who turned reduced
  // motion on kept the trailing ring until they reloaded.
  const { pointerMotion } = useCapability();

  useEffect(() => {
    if (!pointerMotion) return;

    const wrap = root.current;
    const disc = ring.current;
    const text = label.current;
    if (!wrap || !disc || !text) return;

    document.documentElement.dataset.cursorMode = 'custom';

    const pointer = { x: innerWidth / 2, y: innerHeight / 2 };
    const pos = { ...pointer };
    let size = 1;
    let targetSize = 1;
    let shown = false;

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      if (!shown) {
        shown = true;
        pos.x = e.clientX;
        pos.y = e.clientY;
        wrap.style.opacity = '1';
      }

      const hit = (e.target as Element | null)?.closest?.<HTMLElement>('[data-cursor]');
      const caption = hit?.dataset.cursor ?? '';
      if (text.textContent !== caption) text.textContent = caption;
      text.style.opacity = caption ? '1' : '0';
      disc.dataset.state = caption ? 'label' : hit ? 'hover' : 'idle';
      targetSize = caption ? 4.6 : hit ? 2.1 : 1;
    };

    const hide = () => {
      shown = false;
      wrap.style.opacity = '0';
    };

    // Driven by the GSAP ticker rather than a private `requestAnimationFrame`.
    // Lenis, every scrubbed timeline and this ring now share one clock, so the
    // cursor can never land a frame ahead of the page it is pointing at.
    const tick = () => {
      const dt = gsap.ticker.deltaRatio(60) / 60;
      pos.x = damp(pos.x, pointer.x, 0.24, dt);
      pos.y = damp(pos.y, pointer.y, 0.24, dt);
      size = damp(size, targetSize, 0.2, dt);
      wrap.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      disc.style.transform = `translate(-50%, -50%) scale(${size})`;
    };
    gsap.ticker.add(tick);

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', hide);
    window.addEventListener('blur', hide);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', hide);
      window.removeEventListener('blur', hide);
      delete document.documentElement.dataset.cursorMode;
    };
  }, [pointerMotion]);

  return (
    <div
      ref={root}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[var(--z-cursor)] hidden opacity-0 transition-opacity duration-300 [html[data-cursor-mode=custom]_&]:block"
      style={{ willChange: 'transform' }}
    >
      <span
        ref={ring}
        data-state="idle"
        className="absolute block size-[15px] rounded-full border border-ink/80 transition-[background-color,border-color] duration-300 data-[state=label]:border-transparent data-[state=label]:bg-ink"
      />
      <span
        ref={label}
        className="absolute left-1/2 top-1/2 w-[68px] -translate-x-1/2 -translate-y-1/2 text-center text-[9px] font-medium uppercase leading-tight tracking-[0.12em] text-paper opacity-0 transition-opacity duration-200"
      />
    </div>
  );
}
