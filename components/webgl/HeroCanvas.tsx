'use client';

/*
 * three.js is a retained-mode, mutation-based renderer: uniforms are written
 * in place every frame rather than reproduced from React state, which is the
 * whole point of `useFrame`. Reproducing them immutably would allocate on
 * every frame and defeat the purpose. The rule does not apply to this file.
 */
/* eslint-disable react-hooks/immutability */

import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { damp } from '@/lib/utils';

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Two stills dissolved through value noise, with a very shallow lens pull
 * under the cursor. No colour work happens here: the photographs ship as
 * shot, and the shader only moves them.
 */
const FRAG = /* glsl */ `
  precision highp float;

  uniform sampler2D uA;
  uniform sampler2D uB;
  uniform float uAspectA;
  uniform float uAspectB;
  uniform float uPlaneAspect;
  uniform float uMix;
  uniform float uTime;
  uniform vec2  uMouse;
  uniform float uIntro;

  varying vec2 vUv;

  // Sample so the image behaves like background-size: cover.
  vec2 cover(vec2 uv, float texAspect) {
    vec2 s = uPlaneAspect > texAspect
      ? vec2(1.0, texAspect / uPlaneAspect)
      : vec2(uPlaneAspect / texAspect, 1.0);
    return (uv - 0.5) * s + 0.5;
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * valueNoise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;

    // Slow breathing scale keeps the frame from ever feeling frozen.
    float breathe = 1.0 - 0.018 * sin(uTime * 0.12);
    uv = (uv - 0.5) * breathe + 0.5;

    // A shallow pull toward the cursor. Aspect-corrected so it stays round.
    vec2 d = uv - uMouse;
    float r = length(d * vec2(uPlaneAspect, 1.0));
    uv -= normalize(d + 1e-5) * smoothstep(0.62, 0.0, r) * 0.014;

    // Entry: the frame settles out of a slight over-scale.
    uv = (uv - 0.5) * mix(1.09, 1.0, uIntro) + 0.5;

    vec3 colA = texture2D(uA, cover(uv, uAspectA)).rgb;
    vec3 colB = texture2D(uB, cover(uv, uAspectB)).rgb;

    float n = fbm(uv * 2.6 + uTime * 0.015);
    const float edge = 0.34;
    float threshold = mix(-edge, 1.0 + edge, uMix);
    float mask = smoothstep(threshold - edge, threshold + edge, n);

    // Premultiplied: the canvas fades up over the photograph underneath
    // rather than clearing it to black while the textures decode.
    vec3 col = mix(colB, colA, mask);
    gl_FragColor = vec4(col * uIntro, uIntro);
    #include <colorspace_fragment>
  }
`;

/** `Texture.image` is loosely typed; every source here is a decoded bitmap. */
const aspectOf = (t: THREE.Texture) => {
  const img = t.image as { width: number; height: number };
  return img.width / img.height;
};

function Plane({ sources, intro }: { sources: string[]; intro: boolean }) {
  const textures = useTexture(sources);
  const { viewport, size } = useThree();
  const material = useRef<THREE.ShaderMaterial>(null);

  const pair = useRef({ from: 0, to: 1 });
  const mouse = useRef(new THREE.Vector2(0.5, 0.5));
  const target = useRef(new THREE.Vector2(0.5, 0.5));
  const introRef = useRef(0);

  useEffect(() => {
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = THREE.LinearFilter;
      t.generateMipmaps = false;
      t.needsUpdate = true;
    });
  }, [textures]);

  const uniforms = useMemo(
    () => ({
      uA: { value: textures[0] },
      uB: { value: textures[1] ?? textures[0] },
      uAspectA: { value: aspectOf(textures[0]) },
      uAspectB: { value: aspectOf(textures[1] ?? textures[0]) },
      uPlaneAspect: { value: size.width / size.height },
      uMix: { value: 0 },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uIntro: { value: 0 },
    }),
    // Textures are loaded once and never swapped wholesale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    uniforms.uPlaneAspect.value = size.width / size.height;
  }, [size, uniforms]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      target.current.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  // Advance to the next still every few seconds, once the entry has settled.
  const clock = useRef({ elapsed: 0, holding: true });

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const u = uniforms;

    introRef.current = damp(introRef.current, intro ? 1 : 0, 0.035, dt);
    u.uIntro.value = introRef.current;
    u.uTime.value += dt;

    mouse.current.x = damp(mouse.current.x, target.current.x, 0.06, dt);
    mouse.current.y = damp(mouse.current.y, target.current.y, 0.06, dt);
    u.uMouse.value.copy(mouse.current);

    if (!intro || textures.length < 2) return;

    clock.current.elapsed += dt;
    if (clock.current.holding) {
      if (clock.current.elapsed > 5.5) {
        clock.current.holding = false;
        clock.current.elapsed = 0;
      }
    } else {
      const t = Math.min(clock.current.elapsed / 2.4, 1);
      // easeInOutCubic — the dissolve should start and stop, not slide.
      u.uMix.value = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      if (t >= 1) {
        // Fold the finished transition back to a resting state and queue the
        // next still, so uMix always animates 0 -> 1.
        pair.current.from = pair.current.to;
        pair.current.to = (pair.current.to + 1) % textures.length;
        u.uA.value = textures[pair.current.from];
        u.uAspectA.value = aspectOf(textures[pair.current.from]);
        u.uB.value = textures[pair.current.to];
        u.uAspectB.value = aspectOf(textures[pair.current.to]);
        u.uMix.value = 0;
        clock.current.holding = true;
        clock.current.elapsed = 0;
      }
    }
  });

  return (
    <mesh>
      <planeGeometry args={[viewport.width, viewport.height, 1, 1]} />
      <shaderMaterial
        ref={material}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        toneMapped={false}
      />
    </mesh>
  );
}

/**
 * A GPU that drops the context, a driver that refuses the shader, or a texture
 * that will not decode all resolve the same way: tell the caller, which is
 * already showing the photograph underneath, and stop.
 */
class ShaderBoundary extends Component<
  { onFail: () => void; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    console.warn('[hero] shader disabled:', error.message);
    this.props.onFail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function HeroCanvas({
  sources,
  intro,
  onFail,
}: {
  sources: string[];
  intro: boolean;
  onFail: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);

  /**
   * The hero is one section of a long page, but R3F's default frame loop
   * paints every frame for the life of the component — so the shader went on
   * burning GPU while the visitor was six sections further down, for a canvas
   * nobody could see. Parking the loop when it leaves the viewport is the
   * single largest performance win available here, and it is invisible: by
   * the time the hero scrolls back into view the loop has already resumed.
   */
  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      // A margin, so the loop is already running by the time the frame is
      // genuinely on screen rather than starting from a stalled clock.
      { rootMargin: '15% 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={host} className="absolute inset-0">
      <ShaderBoundary onFail={onFail}>
      <Canvas
        // Parked when off screen. `demand` rather than `never` so a resize or
        // a texture settling still gets one frame to repaint with.
        frameloop={onScreen ? 'always' : 'demand'}
        // A range: R3F reads the device ratio and clamps it, capping the
        // shader's fill cost on high-density displays.
        dpr={[1, 1.75]}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 1], fov: 50 }}
        style={{ position: 'absolute', inset: 0 }}
        aria-hidden
        onCreated={({ gl }) => {
          gl.domElement.addEventListener(
            'webglcontextlost',
            (event) => {
              // Prevent the default so the browser does not keep retrying a
              // context we are about to abandon anyway.
              event.preventDefault();
              onFail();
            },
            { once: true }
          );
        }}
      >
        <Suspense fallback={null}>
          <Plane sources={sources} intro={intro} />
        </Suspense>
      </Canvas>
      </ShaderBoundary>
    </div>
  );
}
