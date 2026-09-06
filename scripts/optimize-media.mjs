/**
 * Crops, resizes and encodes the source photography into responsive AVIF/WebP
 * renditions, and emits a typed manifest with LQIP placeholders. Colour is
 * passed through untouched.
 *
 *   node scripts/optimize-media.mjs [--images] [--videos] [--force]
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import ffmpegPath from 'ffmpeg-static';
import { IMAGES, VIDEOS, GRADE, WIDTHS } from './media.config.mjs';

const run = promisify(execFile);
const RAW = 'media-source';
const IMG_OUT = 'public/media/img';
const VID_OUT = 'public/media/video';
const MANIFEST = 'lib/media.generated.ts';

const argv = process.argv.slice(2);
const args = new Set(argv);
const force = args.has('--force');

/**
 * `--only=slug,slug` processes a subset and merges the result into the
 * existing manifest instead of rewriting it.
 *
 * The full run needs every source present, and `media-source/` is gitignored —
 * so on a machine that has only a couple of new frames, a plain `npm run media`
 * would skip the 39 it cannot find (the pool catches per-item errors) and then
 * write a manifest containing only the two it could, silently deleting the
 * rest. Adding one photograph should not require carrying the whole shoot.
 */
const onlyArg = argv.find((a) => a.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',').filter(Boolean)) : null;

const doImages = only
  ? true
  : args.has('--images') || (!args.has('--images') && !args.has('--videos'));
const doVideos = only
  ? false
  : args.has('--videos') || (!args.has('--images') && !args.has('--videos'));

sharp.cache(false);
sharp.concurrency(2);

const ensure = d => fs.mkdirSync(d, { recursive: true });
const fresh = (out, src) =>
  !force && fs.existsSync(out) && fs.statSync(out).mtimeMs > fs.statSync(src).mtimeMs;

async function processImage(entry) {
  const src = path.join(RAW, entry.src);
  if (!fs.existsSync(src)) throw new Error(`missing source: ${src}`);
  ensure(IMG_OUT);

  const meta = await sharp(src).metadata();

  // `crop` is expressed in fractions of the source so the config stays
  // readable and survives a re-export at a different resolution. It is
  // applied before anything else, and the manifest records the cropped size.
  const c = entry.crop;
  const region = c
    ? {
        left: Math.round((c.left ?? 0) * meta.width),
        top: Math.round((c.top ?? 0) * meta.height),
        width: Math.round((c.width ?? 1 - (c.left ?? 0)) * meta.width),
        height: Math.round((c.height ?? 1 - (c.top ?? 0)) * meta.height),
      }
    : null;

  const source = () => (region ? sharp(src).extract(region) : sharp(src));
  const width = region ? region.width : meta.width;
  const height = region ? region.height : meta.height;

  for (const w of WIDTHS) {
    if (w > width * 1.05) continue;
    for (const [fmt, opts] of [
      ['avif', { quality: 58, effort: 6, chromaSubsampling: '4:2:0' }],
      ['webp', { quality: 82, effort: 5 }],
    ]) {
      const out = path.join(IMG_OUT, `${entry.slug}-${w}.${fmt}`);
      if (fresh(out, src)) continue;
      await GRADE(source().resize({ width: w, withoutEnlargement: true }))
        .toFormat(fmt, opts)
        .toFile(out);
    }
  }

  // 20px blurred placeholder, inlined as a data URI
  const lqipBuf = await GRADE(source().resize(20))
    .blur(1.2)
    .webp({ quality: 32 })
    .toBuffer();

  return {
    slug: entry.slug,
    alt: entry.alt,
    width,
    height,
    aspect: Number((width / height).toFixed(4)),
    lqip: `data:image/webp;base64,${lqipBuf.toString('base64')}`,
  };
}

// Colour is left alone, matching the stills. Only the scale filter is applied.
const VF_GRADE = null;

async function processVideo(entry) {
  const src = path.join(RAW, 'video', entry.src);
  if (!fs.existsSync(src)) throw new Error(`missing source: ${src}`);
  ensure(VID_OUT);

  const mp4 = path.join(VID_OUT, `${entry.slug}.mp4`);
  const poster = path.join(VID_OUT, `${entry.slug}-poster.jpg`);
  const vf = VF_GRADE ? `scale=-2:1080,${VF_GRADE}` : 'scale=-2:1080';

  // Seek before -i so the trim is a fast keyframe seek, and cap with -t.
  const trim = entry.trim
    ? ['-ss', String(entry.trim.start), ...(entry.trim.duration ? ['-t', String(entry.trim.duration)] : [])]
    : [];

  if (!fresh(mp4, src)) {
    await run(ffmpegPath, ['-y', '-loglevel', 'error', ...trim, '-i', src, '-an',
      '-vf', vf, '-c:v', 'libx264', '-profile:v', 'high', '-crf', '30',
      '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
  }
  if (!fresh(poster, src)) {
    // Seek rather than `select=eq(n\,N)` — execFile does not go through a
    // shell, and the escaped comma does not survive Windows argument quoting.
    // Taken from the encoded clip, so the poster can never land on a frame
    // the trim removed.
    await run(ffmpegPath, ['-y', '-loglevel', 'error', '-ss', String(entry.poster ?? 1),
      '-i', mp4, '-frames:v', '1', '-q:v', '4', poster]);
  }

  const lqipBuf = await sharp(poster).resize(16).blur(1.2).webp({ quality: 32 }).toBuffer();
  const meta = await sharp(poster).metadata();
  const bytes = fs.statSync(mp4).size;

  return {
    slug: entry.slug,
    alt: entry.alt,
    width: meta.width,
    height: meta.height,
    aspect: Number((meta.width / meta.height).toFixed(4)),
    lqip: `data:image/webp;base64,${lqipBuf.toString('base64')}`,
    mp4Bytes: bytes,
  };
}

async function pool(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        try {
          results[i] = await fn(items[i]);
          process.stdout.write('.');
        } catch (err) {
          process.stdout.write('!');
          console.error(`\n  ${items[i].slug}: ${err.message}`);
        }
      }
    })
  );
  return results.filter(Boolean);
}

const imageQueue = only ? IMAGES.filter((i) => only.has(i.slug)) : IMAGES;
if (only) {
  const missing = [...only].filter((slug) => !IMAGES.some((i) => i.slug === slug));
  if (missing.length) {
    console.error(`no such slug in media.config.mjs: ${missing.join(", ")}`);
    process.exit(1);
  }
}
const images = doImages ? await pool(imageQueue, 4, processImage) : [];
if (doImages) console.log(`
images: ${images.length}/${imageQueue.length}`);

const videos = doVideos ? await pool(VIDEOS, 2, processVideo) : [];
if (doVideos) {
  console.log(`\nvideos: ${videos.length}/${VIDEOS.length}`);
  for (const v of videos) console.log(`  ${v.slug}  ${(v.mp4Bytes / 1e6).toFixed(1)} MB`);
}

// ── manifest ────────────────────────────────────────────────────────
/**
 * A subset run reads the manifest it is about to replace and keeps every entry
 * it did not itself regenerate. A full run has nothing to merge.
 */
function existing(kind) {
  if (!only || !fs.existsSync(MANIFEST)) return [];
  const src = fs.readFileSync(MANIFEST, 'utf8');

  // Located by string search rather than a RegExp built from a template
  // literal. The first attempt did the latter and the escapes were eaten by
  // the template before the RegExp ever saw them — `\{` became `{`, `\s`
  // became `s` — so the pattern silently matched nothing, `existing()`
  // returned empty, and the "merge" replaced 41 entries with 2.
  const head = `export const ${kind} = `;
  const from = src.indexOf(head);
  if (from < 0) return [];
  const open = src.indexOf('{', from + head.length);
  const close = src.indexOf('} as const', open);
  if (open < 0 || close < 0) return [];

  try {
    return Object.values(JSON.parse(src.slice(open, close + 2)));
  } catch (err) {
    console.error(`could not parse the existing ${kind} block: ${err.message}`);
    console.error('refusing to overwrite it');
    process.exit(1);
  }
}

const mergedImages = [
  ...existing('IMAGES').filter((e) => !images.some((i) => i.slug === e.slug)),
  ...images,
];
const mergedVideos = only ? existing('VIDEOS') : videos;

/**
 * Never write a manifest with fewer entries than the one already on disk.
 *
 * This is not hypothetical. A subset run whose filter had silently failed to
 * apply processed all 40 images, skipped the 39 whose sources are not on this
 * machine, and wrote a manifest holding the 2 it could read — deleting 39
 * image entries and all three videos. Git had the file, but the next person
 * will not be watching the output as closely.
 */
const priorCount = fs.existsSync(MANIFEST)
  ? (fs.readFileSync(MANIFEST, 'utf8').match(/"slug":/g) ?? []).length
  : 0;
const nextCount = mergedImages.length + mergedVideos.length;
if (priorCount && nextCount < priorCount && !args.has('--force-shrink')) {
  console.error(
    `
refusing to write ${MANIFEST}: it holds ${priorCount} entries and this run produced ${nextCount}.` +
      `
Use --only=<slug,...> to update a subset, or --force-shrink if the loss is intended.`
  );
  process.exit(1);
}

if (only || (doImages && doVideos)) {
  ensure('lib');
  const body = `// AUTO-GENERATED by scripts/optimize-media.mjs — do not edit.
// Run \`npm run media\` after changing scripts/media.config.mjs.

export type Rendition = {
  readonly slug: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly aspect: number;
  readonly lqip: string;
};

export const IMAGE_WIDTHS = ${JSON.stringify(WIDTHS)} as const;

export const IMAGES = ${JSON.stringify(Object.fromEntries(mergedImages.map(i => [i.slug, i])), null, 2)} as const satisfies Record<string, Rendition>;

export const VIDEOS = ${JSON.stringify(
    Object.fromEntries(mergedVideos.map(({ mp4Bytes, ...v }) => [v.slug, v])), null, 2
  )} as const satisfies Record<string, Rendition>;

export type ImageSlug = keyof typeof IMAGES;
export type VideoSlug = keyof typeof VIDEOS;
`;
  fs.writeFileSync(MANIFEST, body);
  console.log(`\nwrote ${MANIFEST}`);
}
