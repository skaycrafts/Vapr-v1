'use client';

import { useEffect, useRef, useState } from 'react';
import Frame from '@/components/media/Frame';
import { SPACES } from '@/lib/content';
import { damp } from '@/lib/utils';
import type { ImageSlug } from '@/lib/media';

/**
 * An index rather than a gallery. Reading the list gives you the whole
 * building in six lines; a pointer over any line brings that room up under
 * the cursor.
 *
 * The split is by capability, not width: anything that can hover gets the
 * floating plate, anything that cannot gets the same photograph inline under
 * each row. No image is only reachable through an interaction the device
 * cannot perform, and the description beside every name carries the meaning
 * on its own.
 */
export default function Spaces() {
  const [active, setActive] = useState<number | null>(null);
  const plate = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = plate.current;
    const container = list.current;
    if (!el || !container) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const pointer = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    let seeded = false;
    let frame = 0;
    let last = performance.now();

    const onMove = (e: PointerEvent) => {
      const box = container.getBoundingClientRect();
      pointer.x = e.clientX - box.left;
      pointer.y = e.clientY - box.top;
      if (!seeded) {
        pos.x = pointer.x;
        pos.y = pointer.y;
        seeded = true;
      }
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      pos.x = damp(pos.x, pointer.x, 0.12, dt);
      pos.y = damp(pos.y, pointer.y, 0.12, dt);
      // Trailing rotation from the horizontal lag — the plate leans into
      // the direction it is being dragged.
      const lean = Math.max(-7, Math.min(7, (pointer.x - pos.x) * 0.06));
      el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) rotate(${lean}deg)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    container.addEventListener('pointermove', onMove);
    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <section id="spaces" className="gutter relative bg-void py-20 md:py-32">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-hairline pb-8">
        <h2 className="type-display text-[clamp(2rem,4.4vw,3.5rem)] text-chalk">
          The rest of it
        </h2>
        <p className="max-w-[34ch] text-mist">
          Six shared rooms, and what each one is for.
        </p>
      </header>

      <div className="relative">
        <ul ref={list} className="relative" onPointerLeave={() => setActive(null)}>
          {SPACES.map((space, i) => (
            <li key={space.id}>
              {/* Not focusable: the row is a heading and a sentence, with no
                  action behind it. A tab stop that does nothing is worse than
                  no tab stop. */}
              <div
                onPointerEnter={() => setActive(i)}
                data-cursor=""
                className="group grid grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-2 border-b border-hairline py-6 transition-colors duration-500 md:grid-cols-[3rem_minmax(0,1fr)_minmax(0,26rem)] md:py-8"
              >
                <span className="tabular type-label transition-colors duration-500 group-hover:text-chalk">
                  {String(i + 1).padStart(2, '0')}
                </span>

                <h3 className="type-display text-[clamp(1.75rem,3.6vw,2.75rem)] leading-none text-mist transition-colors duration-500 group-hover:text-chalk">
                  {space.name}
                </h3>

                <p className="col-start-2 text-sm text-smoke transition-colors duration-500 group-hover:text-mist md:col-start-3 md:text-right">
                  {space.line}
                </p>
              </div>

              {/* Rendered wherever the follow plate is not. */}
              <div className="plate-inline pb-6">
                <Frame
                  slug={space.image as ImageSlug}
                  sizes="100vw"
                  ratio={16 / 10}
                />
              </div>
            </li>
          ))}
        </ul>

        {/* The plate that follows the cursor. Decorative: every image it can
            show is already reachable inline above. */}
        <div
          ref={plate}
          aria-hidden
          className="plate-follow pointer-events-none absolute left-0 top-0 z-[var(--z-raised)] w-[clamp(15rem,22vw,20rem)]"
          style={{ willChange: 'transform' }}
        >
          {SPACES.map((space, i) => (
            <div
              key={space.id}
              className="absolute inset-0 transition-[opacity,transform] duration-[600ms] ease-[var(--ease-out-quart)]"
              style={{
                opacity: active === i ? 1 : 0,
                transform: active === i ? 'scale(1)' : 'scale(0.94)',
              }}
            >
              <Frame slug={space.image as ImageSlug} sizes="22vw" ratio={4 / 5} />
            </div>
          ))}
          {/* Reserve the height so the absolutely-placed plates have a box. */}
          <div className="invisible aspect-[4/5]" />
        </div>
      </div>
    </section>
  );
}
