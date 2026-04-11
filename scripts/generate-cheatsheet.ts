import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { PDFParse } from 'pdf-parse';

const MANUALS_DIR = join(import.meta.dir, '..', 'manuals');
const OUTPUT_DIR = join(import.meta.dir, '..', 'src', 'data', 'modules');
const SCHEMA = readFileSync(join(import.meta.dir, '..', 'modules.schema.json'), 'utf-8');

const MIN_TEXT_CHARS = 200; // PDFs with less text than this are likely scanned/image-only

const PROMPT = `You are creating a cheat sheet for a eurorack module. Extract ALL controls, inputs, outputs, modes/behaviors, and suggest practical patch ideas based on the manual content.

Requirements:
- Be comprehensive: include every knob, switch, button, jack on the module
- Be concise: each description should be one sentence max, under 40 words
- For controls, always include the technical detail (voltage range, time range, or behavior notation)
- For I/O, include the voltage range if mentioned in the manual
- For patch ideas, include 3-5 creative and practical suggestions using the module's own I/O
- Tags must be from this list ONLY: OSCILLATOR, VCO, VCA, VCF, FILTER, ENVELOPE, LFO, FUNCTION, SEQUENCER, CLOCK, UTILITY, MIXER, REVERB, DELAY, EFFECTS, DISTORTION, GRANULAR, SAMPLER, WAVESHAPER, QUANTIZER, NOISE, SLEW, RANDOM, LOGIC, SWITCH, ATTENUATOR, ATTENUVERTER, TRIGGER, GATE, DRUM, COMPRESSOR, EQ, PHASER, CHORUS, GLITCH, BUFFER, RESONATOR, WAVEFOLDER, MIDI, I/O, MULT

Return ONLY valid JSON (no markdown fences, no commentary) matching this schema:

${SCHEMA}

IMPORTANT: Set _meta.schemaVersion to 1, _meta.verified to false, _meta.generatedAt to today's date (ISO format). Set the slug field to the lowercase manufacturer name and module name joined by "--" with spaces as hyphens (e.g. "make-noise--maths").`;

async function extractPdfText(pdfPath: string): Promise<{ text: string; pages: number }> {
  const buffer = readFileSync(pdfPath);
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return { text: result.text, pages: result.total };
}

function slugify(manufacturer: string, moduleName: string): string {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${clean(manufacturer)}--${clean(moduleName)}`;
}

function findManualPath(manufacturer: string, moduleName: string): string | null {
  const mfrDir = manufacturer.replace(/\s+/g, '_');
  const modFile = moduleName.replace(/\s+/g, '_').replace(/\//g, '-') + '.pdf';
  const fullPath = join(MANUALS_DIR, mfrDir, modFile);
  return existsSync(fullPath) ? fullPath : null;
}

async function generateModule(manufacturer: string, moduleName: string, force: boolean): Promise<void> {
  const slug = slugify(manufacturer, moduleName);
  const outputPath = join(OUTPUT_DIR, `${slug}.json`);

  if (existsSync(outputPath) && !force) {
    console.log(`  SKIP: ${slug}.json already exists (use --force to overwrite)`);
    return;
  }

  const manualPath = findManualPath(manufacturer, moduleName);
  if (!manualPath) {
    console.log(`  SKIP: No PDF manual found for ${moduleName} (${manufacturer})`);
    return;
  }

  console.log(`  Reading PDF: ${basename(manualPath)}...`);
  const { text, pages } = await extractPdfText(manualPath);

  // PDF quality guard
  if (text.length < MIN_TEXT_CHARS) {
    console.log(`  SKIP [LOW QUALITY]: ${basename(manualPath)} — only ${text.length} chars extracted from ${pages} pages. Likely scanned/image-only PDF.`);
    return;
  }

  // Truncate very long manuals to avoid token limits
  const truncated = text.slice(0, 30000);
  const truncatedNote = text.length > 30000 ? ` (truncated from ${text.length} chars)` : '';

  console.log(`  Generating via Claude API — ${truncated.length} chars${truncatedNote}, ${pages} pages...`);

  const client = new Anthropic();
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `${PROMPT}\n\nManual content for "${moduleName}" by "${manufacturer}":\n\n${truncated}`,
      },
    ],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  // Strip markdown fences if Claude wrapped the JSON
  let jsonStr = responseText.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  let moduleData: any;
  try {
    moduleData = JSON.parse(jsonStr);
  } catch (e) {
    console.error(`  ERROR: Failed to parse JSON response for ${moduleName}. Saving raw response for debugging.`);
    writeFileSync(outputPath.replace('.json', '.error.txt'), responseText);
    return;
  }

  // Ensure slug matches our convention (don't trust the LLM)
  moduleData.slug = slug;
  moduleData._meta = {
    ...moduleData._meta,
    schemaVersion: 1,
    verified: false,
    generatedAt: new Date().toISOString().split('T')[0],
  };

  writeFileSync(outputPath, JSON.stringify(moduleData, null, 2) + '\n');
  console.log(`  DONE: ${slug}.json — ${moduleData.name} (${moduleData.controls?.length || 0} controls, ${moduleData.inputs?.length || 0}in, ${moduleData.outputs?.length || 0}out)`);
}

// --- CLI ---

const args = process.argv.slice(2);
const force = args.includes('--force');
const allFlag = args.includes('--all');
const moduleArg = args.find((_, i) => args[i - 1] === '--module');
const mfrArg = args.find((_, i) => args[i - 1] === '--manufacturer');

if (allFlag) {
  console.log('Generating cheat sheets for all modules with PDFs...\n');

  const manufacturers = readdirSync(MANUALS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  let generated = 0;
  let skipped = 0;

  for (const mfrDir of manufacturers) {
    const mfr = mfrDir.replace(/_/g, ' ');
    const pdfs = readdirSync(join(MANUALS_DIR, mfrDir)).filter((f) => f.endsWith('.pdf'));

    for (const pdf of pdfs) {
      const modName = basename(pdf, '.pdf').replace(/_/g, ' ').replace(/-/g, '/');
      try {
        await generateModule(mfr, modName, force);
        generated++;
      } catch (e: any) {
        console.error(`  ERROR: ${modName} — ${e.message}`);
        skipped++;
      }
    }
  }

  console.log(`\nDone. ${generated} processed, ${skipped} errors.`);
} else if (moduleArg && mfrArg) {
  await generateModule(mfrArg, moduleArg, force);
} else {
  console.log('Usage:');
  console.log('  bun run generate -- --module "MATHS" --manufacturer "Make Noise"');
  console.log('  bun run generate -- --all');
  console.log('  bun run generate -- --all --force');
  process.exit(1);
}
