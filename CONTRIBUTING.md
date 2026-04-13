# Contributing to Voltpages

Add cheat sheets for eurorack modules by creating a JSON data file.

## Local setup

```bash
git clone https://github.com/ogabrielluiz/voltpages.git
cd voltpages
bun install
git config core.hooksPath .githooks   # enable the pre-commit validator
```

The pre-commit hook runs `bun run validate` automatically when you stage
changes under `src/data/modules/`, `modules.schema.json`, or the validator
itself — same check CI runs. Skip it for a work-in-progress commit with
`git commit --no-verify` (CI will still enforce it on the PR).

## Adding a module

1. Fork and clone the repo (see above)
2. Create `src/data/modules/manufacturer--module-name.json`
3. Run `bun run validate` to check your file (the pre-commit hook does this for you on commit)
4. Open a PR — the PR template has a checklist to walk through

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

## Need help writing a sheet?

If you have the module's PDF manual or know the module well, you can ask any AI assistant to help structure the JSON. Use the MATHS example as a template to show it what format you need.

## Reporting a problem

- Broken sheet, wrong data, rendering glitch? [Open a bug report](https://github.com/ogabrielluiz/voltpages/issues/new?template=bug-report.yml).
- Want a module covered? [Request one](https://github.com/ogabrielluiz/voltpages/issues/new?template=module-request.yml).

## How CI checks your PR

Two things run on every PR that touches module data, the schema, or the renderer:

1. `bun run validate` — schema, tag enum, filename convention, patchflow diagram parsing.
2. `bun run build` — full site build. Catches renderer drift (e.g. a schema change that breaks a component) that the validator alone would miss.

Both also run on direct pushes to `main` as a safety net before deploy.
