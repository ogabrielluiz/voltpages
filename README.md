# Voltpages

Quick-reference cheat sheets for eurorack modules — controls, I/O, behaviors, and patch ideas for each module, one page each.

**Live site:** <https://ogabrielluiz.github.io/voltpages/>

Every sheet is a JSON file in [`src/data/modules/`](src/data/modules/) validated against [`modules.schema.json`](modules.schema.json) and rendered as a static page by Astro. Patch diagrams use [patchflow](https://github.com/ogabrielluiz/patchflow) notation and are type-checked by the same validator.

## Adding a module

See [CONTRIBUTING.md](CONTRIBUTING.md). In short:

1. Create `src/data/modules/{manufacturer-slug}--{module-slug}.json`, matching an existing sheet like [`make-noise--maths.json`](src/data/modules/make-noise--maths.json) as a template.
2. Run `bun run validate` until it reports zero errors.
3. Open a PR.

## Local development

```bash
bun install
bun run dev      # http://localhost:4321/voltpages/
bun run build    # static output to dist/
bun run validate # schema + patchflow diagram check over all sheets
```

## License

[MIT](LICENSE).
