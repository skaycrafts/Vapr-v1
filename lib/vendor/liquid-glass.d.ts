declare module '@/lib/vendor/liquid-glass' {
  export type LiquidGlassOptions = {
    /** Displacement strength; negative values bulge outward. -60 subtle, -180 dramatic. */
    scale?: number;
    /** Per-channel stagger producing the prism fringe. 0 disables it. */
    chroma?: number;
    /** Neutral interior inset as a fraction of the shorter side. */
    border?: number;
    /** Curvature of the bulge: small is a hard rim, large is a dome. */
    mapBlur?: number;
    /** Backdrop blur inside the glass. */
    blur?: number;
    /** Backdrop saturation multiplier. */
    saturate?: number;
    /** Corner radius override in px; defaults to the element's border-radius. */
    radius?: number | null;
    /** Frosted blur used where SVG-filtered backdrops are unsupported. */
    fallbackBlur?: number;
  };

  export type LiquidGlassHandle = {
    /** False in Safari and Firefox, where the frosted fallback is applied. */
    supported: boolean;
    /** Regenerate the displacement map after a manual size change. */
    refresh: () => void;
    destroy: () => void;
  };

  export default function liquidGlass(
    el: HTMLElement,
    opts?: LiquidGlassOptions
  ): LiquidGlassHandle;
}
