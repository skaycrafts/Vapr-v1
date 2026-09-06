/**
 * Builds the deployable brand assets from the supplied VAPR artwork.
 *
 *   node scripts/build-brand.mjs [path-to-artwork.png]
 *
 * The artwork is the final identity and is never redrawn here — this script
 * only trims, re-colours and resizes it. Everything it does is reversible from
 * the original file, and nothing it emits contains a mark that was not in the
 * source.
 *
 * ── What it produces, and why there are two colours ─────────────────────
 * The artwork is black line work on white. The site is a drenched-black
 * surface, so a black-on-transparent emblem would be invisible on it — but a
 * white-on-transparent one is equally useless on a light ground (a printed
 * sheet, a light-themed browser tab). Both are cut from the same alpha
 * channel, so they are the same artwork with the ink swapped, not two
 * drawings.
 *
 *   vapr-emblem.png         black ink, transparent — the master
 *   vapr-emblem-light.png   white ink, transparent — every on-site use
 *
 * Alpha comes from the artwork's own luminance, which preserves the
 * anti-aliasing on every hairline. Thresholding instead would have shredded
 * the finest ornament, which is most of the mark.
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import ffmpegPath from 'ffmpeg-static';

const SRC = process.argv[2] ?? 'media-source/brand/vapr-emblem-source.png';
const REVEAL_SRC = 'media-source/brand/vapr-logo-reveal.mp4';
const OUT = 'public/brand';
const ICON_DIR = 'app';

const run = promisify(execFile);

/**
 * A full ladder rather than three big steps.
 *
 * The mark is ~2% ink, almost all of it hairlines finer than a pixel at small
 * sizes. When the browser was handed a 256px file and asked for 56, its own
 * downscale averaged those hairlines into a grey haze and the wordmark inside
 * the ring disappeared. Resampling each rendition from the 2157px master with
 * Lanczos keeps far more of that structure — so the ladder is dense enough
 * that the browser is nearly always drawing a file at, or just above, its
 * real display size instead of shrinking a much larger one.
 */
const SIZES = [1024, 512, 256, 192, 144, 112, 96, 64, 48];
/** The void, so the favicon reads on a light browser chrome as well as dark. */
const VOID = { r: 13, g: 13, b: 13, alpha: 1 };

if (!fs.existsSync(SRC)) {
  console.error(`missing artwork: ${SRC}`);
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

/** The tightest square around the ink — the circle, with the page trimmed. */
async function inkBox(input) {
  const { data, info } = await sharp(input)
    .flatten({ background: '#ffffff' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let minX = info.width, minY = info.height, maxX = -1, maxY = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (data[y * info.width + x] < 240) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Square it about the ink's own centre. The mark is a circle, so its
  // bounding box is square to within a pixel already; forcing it exactly
  // square is what guarantees the emblem can never render as an ellipse
  // however it is later sized.
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const side = Math.max(w, h);
  const cx = minX + w / 2;
  const cy = minY + h / 2;

  return {
    left: Math.max(0, Math.round(cx - side / 2)),
    top: Math.max(0, Math.round(cy - side / 2)),
    width: Math.min(side, info.width),
    height: Math.min(side, info.height),
  };
}

/**
 * ── The reveal clip ─────────────────────────────────────────────────────
 * The supplied animation is 1280x720, ten seconds, 9.9 Mbps with an audio
 * track it does not need. Three things are done to it, and nothing else:
 *
 *  1. CROP to the square the mark actually occupies. The emblem is centred on
 *     (637, 361) and never exceeds 596px across in the kept material, so a
 *     720x720 crop about that centre loses nothing and gives the hero a box
 *     whose geometry is knowable: the resolved emblem is 511/720 = 70.97% of
 *     it, dead centre. That constant is what lets the hero size the clip so
 *     its final frame lands exactly on top of the static emblem.
 *
 *  2. CUT the zoom. At 5.49s the animation hard-cuts to a push-in roughly
 *     twice the scale, holds it to 7.40s, then hard-cuts back. Two jump cuts
 *     in a site with no others — but the reason it goes is geometric, not a
 *     matter of taste: sized so the resolved emblem matches the hero mark,
 *     that beat renders about 850px tall in a 414px slot and crosses the
 *     headline at every desktop width. The ornament is identically complete
 *     either side of the cut, so the two halves join on a 0.45s dissolve —
 *     needed because the ornament rotates continuously and a hard splice
 *     would pop both the scale and the rotation phase.
 *
 *  3. STRIP the audio, which is 128 kb/s of nothing a muted hero can use.
 *
 * No frame is recoloured, retimed or redrawn.
 *
 * Two codecs because this is white line art on black: h264 smears hairlines
 * into mosquito noise at the bitrates VP9 holds them at, and every browser
 * that can decode the webm prefers it.
 */
const REVEAL = {
  /** Frame-accurate at 24fps: the last frame before the push-in, and the first after it. */
  cutIn: 5.4917,
  cutOut: 7.4167,
  dissolve: 0.45,
  /** Square crop about the emblem's own centre, measured off the resolved frame. */
  crop: { size: 720, left: 277, top: 0 },
};

async function buildReveal() {
  if (!fs.existsSync(REVEAL_SRC)) {
    console.log(`  reveal    skipped — no ${REVEAL_SRC}`);
    return;
  }

  const { size, left, top } = REVEAL.crop;
  // xfade consumes `dissolve` seconds from the tail of the first segment, so
  // the offset is pulled back by exactly that much to keep the cut point.
  const graph = [
    `[0:v]crop=${size}:${size}:${left}:${top},setsar=1,split=2[a][b]`,
    `[a]trim=0:${REVEAL.cutIn},setpts=PTS-STARTPTS[s1]`,
    `[b]trim=${REVEAL.cutOut},setpts=PTS-STARTPTS[s2]`,
    `[s1][s2]xfade=transition=fade:duration=${REVEAL.dissolve}:offset=${(REVEAL.cutIn - REVEAL.dissolve).toFixed(4)},format=yuv420p[v]`,
  ].join(';');

  const mp4 = path.join(OUT, 'vapr-logo-reveal.mp4');
  const webm = path.join(OUT, 'vapr-logo-reveal.webm');

  await run(ffmpegPath, ['-y', '-loglevel', 'error', '-i', REVEAL_SRC,
    '-filter_complex', graph, '-map', '[v]', '-an',
    '-c:v', 'libx264', '-crf', '23', '-preset', 'veryslow', '-tune', 'animation',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);

  // Transcoded from the mp4 rather than re-running the graph: identical frames
  // in both files, so the two codecs can never drift out of sync.
  await run(ffmpegPath, ['-y', '-loglevel', 'error', '-i', mp4,
    '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '0', '-row-mt', '1', '-an', webm]);

  console.log(
    `  reveal    mp4 ${(fs.statSync(mp4).size / 1024).toFixed(0)}kB  webm ${(fs.statSync(webm).size / 1024).toFixed(0)}kB`
  );
}

async function build() {
  const box = await inkBox(SRC);
  console.log(`artwork trimmed to ${box.width}x${box.height} at (${box.left},${box.top})`);

  // The ink coverage of every pixel, kept as a continuous ramp.
  const cropped = sharp(SRC).flatten({ background: '#ffffff' }).extract(box);
  const { data: mask, info } = await cropped
    .clone()
    .greyscale()
    .negate()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Two passes on purpose. Chaining `.resize()` straight after `.joinChannel()`
  // silently does nothing — sharp had already fixed the pipeline geometry to
  // the joined channel's dimensions, so every rendition came out at the full
  // 2157px and the "256px" file was 74kB of full-resolution artwork.
  const tinted = async (rgb) =>
    sharp({
      create: { width: info.width, height: info.height, channels: 3, background: rgb },
    })
      .joinChannel(mask, { raw: { width: info.width, height: info.height, channels: 1 } })
      .png()
      .toBuffer();

  const blackFull = await tinted('#000000');
  const lightFull = await tinted('#ffffff');

  const tint = async (full, size) =>
    sharp(full)
      .resize(size, size, { kernel: 'lanczos3' })
      .png({ compressionLevel: 9, palette: true, quality: 100 })
      .toBuffer();

  for (const size of SIZES) {
    const black = await tint(blackFull, size);
    const light = await tint(lightFull, size);
    const suffix = size === SIZES[0] ? '' : `-${size}`;
    fs.writeFileSync(path.join(OUT, `vapr-emblem${suffix}.png`), black);
    fs.writeFileSync(path.join(OUT, `vapr-emblem-light${suffix}.png`), light);
    console.log(
      `  ${String(size).padStart(4)}px  emblem ${(black.length / 1024).toFixed(1)}kB  light ${(light.length / 1024).toFixed(1)}kB`
    );
  }

  // ── Favicons ────────────────────────────────────────────────────────────
  // On a solid void ground rather than transparent: a transparent emblem is
  // invisible against whichever browser chrome happens to match its ink, and
  // a tab icon that disappears half the time is not an icon. White on void is
  // also how the mark appears everywhere on the site, so the tab matches.
  const plate = async (size, pad) => {
    const inner = Math.round(size * (1 - pad * 2));
    const ink = await sharp(lightFull).resize(inner, inner, { kernel: 'lanczos3' }).png().toBuffer();

    return sharp({ create: { width: size, height: size, channels: 4, background: VOID } })
      .composite([{ input: ink, gravity: 'center' }])
      .png({ compressionLevel: 9 })
      .toBuffer();
  };

  fs.writeFileSync(path.join(ICON_DIR, 'icon.png'), await plate(512, 0.06));
  fs.writeFileSync(path.join(ICON_DIR, 'apple-icon.png'), await plate(180, 0.1));

  // A real .ico as well as the PNG. Next serves `/favicon.ico` only when the
  // file exists, and browsers, bookmark managers and crawlers still ask for
  // that path by name — leaving the old one in place would have meant the
  // previous icon quietly outliving the rebrand in exactly the places people
  // notice a brand.
  //
  // ICO can carry PNG payloads directly (Vista onward), so each size is just
  // the plate above with a 16-byte directory entry in front of it.
  const icoSizes = [16, 32, 48];
  const plates = await Promise.all(icoSizes.map((n) => plate(n, 0.04)));
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(icoSizes.length, 4);

  let offset = 6 + 16 * icoSizes.length;
  const dir = [];
  for (let i = 0; i < icoSizes.length; i += 1) {
    const e = Buffer.alloc(16);
    e.writeUInt8(icoSizes[i] === 256 ? 0 : icoSizes[i], 0);
    e.writeUInt8(icoSizes[i] === 256 ? 0 : icoSizes[i], 1);
    e.writeUInt8(0, 2); // palette size — 0 for truecolour
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(plates[i].length, 8);
    e.writeUInt32LE(offset, 12);
    offset += plates[i].length;
    dir.push(e);
  }
  fs.writeFileSync(path.join(ICON_DIR, 'favicon.ico'), Buffer.concat([header, ...dir, ...plates]));

  console.log(
    `  favicons  app/icon.png (512)  app/apple-icon.png (180)  app/favicon.ico (${icoSizes.join('/')})`
  );

  await buildReveal();
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
