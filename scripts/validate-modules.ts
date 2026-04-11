import { readdirSync, readFileSync } from 'fs';
import { join, basename } from 'path';

const MODULES_DIR = join(import.meta.dir, '..', 'src', 'data', 'modules');
const SCHEMA = JSON.parse(readFileSync(join(import.meta.dir, '..', 'modules.schema.json'), 'utf-8'));

const VALID_TAGS = SCHEMA.properties.tags.items.enum as string[];
const FILENAME_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?--[a-z0-9]([a-z0-9-]*[a-z0-9])?\.json$/;
const MAX_DESCRIPTION_WORDS = 40;

let errors = 0;
let warnings = 0;

function err(file: string, msg: string) {
  console.error(`  ERROR [${file}]: ${msg}`);
  errors++;
}

function warn(file: string, msg: string) {
  console.warn(`  WARN  [${file}]: ${msg}`);
  warnings++;
}

const files = readdirSync(MODULES_DIR).filter((f) => f.endsWith('.json'));

if (files.length === 0) {
  console.error('FATAL: No module JSON files found in src/data/modules/');
  process.exit(1);
}

console.log(`Validating ${files.length} module files...\n`);

for (const file of files) {
  const raw = readFileSync(join(MODULES_DIR, file), 'utf-8');
  let data: any;

  try {
    data = JSON.parse(raw);
  } catch {
    err(file, 'Invalid JSON — cannot parse');
    continue;
  }

  // Filename convention
  if (!FILENAME_RE.test(file)) {
    err(file, `Filename must match "manufacturer--module-name.json" (lowercase, hyphens). See CONTRIBUTING.md.`);
  }

  // Slug matches filename
  const expectedSlug = basename(file, '.json');
  if (data.slug !== expectedSlug) {
    err(file, `slug "${data.slug}" does not match filename. Expected "${expectedSlug}".`);
  }

  // Required top-level fields
  for (const field of ['_meta', 'slug', 'name', 'manufacturer', 'hp', 'tags', 'description', 'controls', 'inputs', 'outputs', 'behaviors', 'patchIdeas']) {
    if (data[field] === undefined || data[field] === null) {
      err(file, `Missing required field: ${field}`);
    }
  }

  // Meta fields
  if (data._meta) {
    if (data._meta.schemaVersion !== 1) err(file, `_meta.schemaVersion must be 1, got ${data._meta.schemaVersion}`);
    if (typeof data._meta.verified !== 'boolean') err(file, `_meta.verified must be a boolean`);
  }

  // Tags validation against enum
  if (Array.isArray(data.tags)) {
    if (data.tags.length === 0) err(file, 'tags must have at least one entry');
    for (const tag of data.tags) {
      if (!VALID_TAGS.includes(tag)) {
        err(file, `Unknown tag "${tag}". Valid tags: ${VALID_TAGS.join(', ')}`);
      }
    }
  }

  // Description word count (museum label density)
  if (typeof data.description === 'string') {
    const wordCount = data.description.split(/\s+/).length;
    if (wordCount > MAX_DESCRIPTION_WORDS) {
      warn(file, `Description is ${wordCount} words (target: ≤${MAX_DESCRIPTION_WORDS}). Keep it dense.`);
    }
    if (data.description.length < 10) {
      err(file, `Description too short (${data.description.length} chars). Minimum 10.`);
    }
  }

  // Controls
  if (Array.isArray(data.controls)) {
    for (const [i, ctrl] of data.controls.entries()) {
      for (const f of ['name', 'scope', 'description', 'detail']) {
        if (!ctrl[f]) err(file, `controls[${i}] missing field: ${f}`);
      }
      if (ctrl.description && ctrl.description.split(/\s+/).length > MAX_DESCRIPTION_WORDS) {
        warn(file, `controls[${i}].description is over ${MAX_DESCRIPTION_WORDS} words`);
      }
    }
  }

  // Inputs/Outputs
  for (const ioType of ['inputs', 'outputs'] as const) {
    if (Array.isArray(data[ioType])) {
      for (const [i, io] of data[ioType].entries()) {
        if (!io.name) err(file, `${ioType}[${i}] missing field: name`);
        if (!io.description) err(file, `${ioType}[${i}] missing field: description`);
      }
    }
  }

  // Behaviors
  if (Array.isArray(data.behaviors)) {
    for (const [i, b] of data.behaviors.entries()) {
      for (const f of ['name', 'trigger', 'description']) {
        if (!b[f]) err(file, `behaviors[${i}] missing field: ${f}`);
      }
    }
  }

  // Patch Ideas
  if (Array.isArray(data.patchIdeas)) {
    for (const [i, p] of data.patchIdeas.entries()) {
      for (const f of ['name', 'patch']) {
        if (!p[f]) err(file, `patchIdeas[${i}] missing field: ${f}`);
      }
    }
  }

  if (errors === 0) {
    const badge = data._meta?.verified ? '✓' : 'AI';
    console.log(`  OK [${badge}]: ${file} — ${data.name} (${data.manufacturer}, ${data.hp}HP)`);
  }
}

console.log(`\n${files.length} files, ${errors} errors, ${warnings} warnings.`);
if (errors > 0) process.exit(1);
