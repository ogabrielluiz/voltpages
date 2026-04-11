# Contributing to Eurorack Sheets

Add cheat sheets for eurorack modules by creating a JSON data file.

## Adding a module

1. Fork and clone the repo
2. Create `src/data/modules/manufacturer--module-name.json`
3. Run `bun run validate` to check your file
4. Open a PR

### Filename convention

Lowercase, hyphens for spaces, double-dash separates manufacturer from module:

- `make-noise--maths.json`
- `intellijel--quadrax.json`
- `noise-engineering--basimilus-iteritas-alia.json`
- `erica-synths--pico-quant.json`

### JSON schema

Every module file must include these fields. Use `src/data/modules/make-noise--maths.json` as a reference.

Point your editor at `modules.schema.json` for autocomplete — add `"$schema": "../../modules.schema.json"` to the top of your file.

**Required fields:**
- `_meta.schemaVersion`: always `1`
- `_meta.verified`: `true` if you've reviewed the content, `false` if AI-generated
- `slug`: must match the filename (without `.json`)
- `name`, `manufacturer`, `hp`: from the module spec
- `tags`: at least one, from the allowed list (see `modules.schema.json`)
- `description`: 1–2 sentences, under 40 words
- `controls`: every knob, switch, button on the panel
- `inputs`, `outputs`: every jack, with optional `voltage` and `normalizedTo`
- `behaviors`: operating modes, triggered by what
- `patchIdeas`: 3–5 practical suggestions

### Content style guide

- Present tense, third person: "Generates a function" not "You can generate"
- One sentence per description, under 40 words
- Technical detail in monospace notation: `CCW: expo · noon: linear · CW: log`
- Patch ideas use `·` as separator: `EOR → TRIG · short Rise · long Fall`
- No marketing language from manufacturer websites

### Modules without a PDF manual

Many modules don't have a PDF — that's fine. Write the JSON by hand using the module's panel labels, manufacturer website, or your own knowledge. The schema is the same regardless of source.

## AI-assisted generation (optional)

If you have an Anthropic API key, you can generate a starting point from a PDF:

```bash
bun run generate -- --module "Module Name" --manufacturer "Manufacturer"
```

Review and edit the output before submitting. AI-generated sheets should have `_meta.verified: false`.
