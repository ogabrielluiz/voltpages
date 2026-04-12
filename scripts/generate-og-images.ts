/**
 * Generate OG images (1200x630 PNG) for each module.
 * Uses satori (HTML→SVG) + sharp (SVG→PNG).
 *
 * Run: bun run scripts/generate-og-images.ts
 */

import { readdirSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { join, basename } from 'path';
import satori from 'satori';
import sharp from 'sharp';

const MODULES_DIR = join(import.meta.dir, '..', 'src', 'data', 'modules');
const OUTPUT_DIR = join(import.meta.dir, '..', 'public', 'og');

async function loadFont(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
  });
  if (!res.ok) throw new Error(`Failed to load font: ${res.status} ${res.statusText}`);
  const buf = await res.arrayBuffer();
  // Verify it's a font file (starts with wOFF, OTTO, or \x00\x01)
  const sig = new Uint8Array(buf.slice(0, 4));
  const sigStr = String.fromCharCode(...sig);
  if (!sigStr.startsWith('wOFF') && !sigStr.startsWith('wOF2') && !sigStr.startsWith('OTTO') && sig[0] !== 0 && sig[0] !== 0x74) {
    throw new Error(`Not a valid font file (got: ${sigStr.slice(0, 4)})`);
  }
  return buf;
}

// TTF fonts (satori requires woff or ttf, not woff2)
const FONT_URL = 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf';
const FONT_BOLD_URL = 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf';
const FONT_MONO_URL = 'https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-400-normal.ttf';

interface Module {
  name: string;
  manufacturer: string;
  hp: number;
  tags: string[];
  description: string;
}

async function generateOgImage(module: Module, slug: string, fontData: ArrayBuffer, monoFontData: ArrayBuffer) {
  const outputPath = join(OUTPUT_DIR, `${slug}.png`);

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          backgroundColor: '#f7f5f0',
          fontFamily: 'Inter',
        },
        children: [
          // Top: module name + manufacturer
          {
            type: 'div',
            props: {
              style: { display: 'flex', flexDirection: 'column' },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 72,
                      fontWeight: 700,
                      color: '#1a1a1a',
                      letterSpacing: '-1px',
                      lineHeight: 1.1,
                    },
                    children: module.name,
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 28,
                      color: '#666666',
                      marginTop: '12px',
                    },
                    children: `${module.manufacturer}  ·  ${module.hp}HP`,
                  },
                },
              ],
            },
          },
          // Bottom: tags + site name
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
                    children: module.tags.slice(0, 5).map((tag) => ({
                      type: 'div',
                      props: {
                        style: {
                          fontSize: 18,
                          fontFamily: 'JetBrains Mono',
                          color: '#666666',
                          letterSpacing: '1.5px',
                          border: '1.5px solid #d0cdc6',
                          padding: '6px 14px',
                        },
                        children: tag,
                      },
                    })),
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                    },
                    children: [
                      {
                        type: 'svg',
                        props: {
                          width: 34,
                          height: 34,
                          viewBox: '0 0 48 48',
                          xmlns: 'http://www.w3.org/2000/svg',
                          children: [
                            { type: 'rect', props: { x: 5, y: 5, width: 38, height: 38, rx: 2, fill: '#1a1a1a' } },
                            { type: 'circle', props: { cx: 10, cy: 10, r: 1.8, fill: 'none', stroke: '#f7f5f0', 'stroke-width': 1.2 } },
                            { type: 'circle', props: { cx: 38, cy: 10, r: 1.8, fill: 'none', stroke: '#f7f5f0', 'stroke-width': 1.2 } },
                            { type: 'circle', props: { cx: 10, cy: 38, r: 1.8, fill: 'none', stroke: '#f7f5f0', 'stroke-width': 1.2 } },
                            { type: 'circle', props: { cx: 38, cy: 38, r: 1.8, fill: 'none', stroke: '#f7f5f0', 'stroke-width': 1.2 } },
                            { type: 'line', props: { x1: 15, y1: 24, x2: 33, y2: 24, stroke: '#f7f5f0', 'stroke-width': 0.6, opacity: 0.3 } },
                            { type: 'line', props: { x1: 24, y1: 15, x2: 24, y2: 33, stroke: '#f7f5f0', 'stroke-width': 0.6, opacity: 0.3 } },
                            { type: 'path', props: { d: 'M 13 24 C 16 24, 17 32, 20 32 C 23 32, 23 16, 26 16 C 29 16, 30 24, 35 24', fill: 'none', stroke: '#f7f5f0', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' } },
                            { type: 'circle', props: { cx: 26, cy: 16, r: 2, fill: '#d9571f' } },
                          ],
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: 20,
                            fontFamily: 'JetBrains Mono',
                            color: '#767676',
                            letterSpacing: '3px',
                            textTransform: 'uppercase',
                          },
                          children: 'VOLTPAGES',
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Inter', data: fontData, weight: 400, style: 'normal' },
        { name: 'Inter', data: fontBoldData, weight: 700, style: 'normal' },
        { name: 'JetBrains Mono', data: monoFontData, weight: 400, style: 'normal' },
      ],
    },
  );

  await sharp(Buffer.from(svg)).png({ quality: 90 }).toFile(outputPath);
}

// --- Main ---

if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('Loading fonts...');
const [fontData, fontBoldData, monoFontData] = await Promise.all([
  loadFont(FONT_URL),
  loadFont(FONT_BOLD_URL),
  loadFont(FONT_MONO_URL),
]);

const allFiles = readdirSync(MODULES_DIR).filter((f) => f.endsWith('.json'));
const files = allFiles.filter((file) => {
  const data = JSON.parse(readFileSync(join(MODULES_DIR, file), 'utf-8'));
  return data._meta?.verified === true;
});
const skipped = allFiles.length - files.length;
console.log(`Generating OG images for ${files.length} verified modules${skipped ? ` (skipping ${skipped} drafts)` : ''}...\n`);

for (const file of files) {
  const slug = basename(file, '.json');
  const data: Module = JSON.parse(readFileSync(join(MODULES_DIR, file), 'utf-8'));

  try {
    await generateOgImage(data, slug, fontData, monoFontData);
    console.log(`  OK: ${slug}.png`);
  } catch (e: any) {
    console.error(`  ERROR: ${slug} — ${e.message}`);
  }
}

console.log('\nDone.');
