import type { Module } from '../types/module';

const moduleFiles = import.meta.glob<Module>('../data/modules/*.json', { eager: true, import: 'default' });

type Entry = { slug: string; module: Module };

function loadAll(): Entry[] {
  return Object.entries(moduleFiles).map(([path, module]) => {
    const filename = path.split('/').pop()!.replace('.json', '');
    return { slug: module.slug || filename, module };
  });
}

// Public default: verified sheets that are standalone modules (not expanders).
// Unverified sheets are drafts hidden from the site; expanders render inside
// their parent's page rather than as independent grid entries.
export function getAllModules(): Entry[] {
  return loadAll().filter((entry) =>
    entry.module._meta?.verified === true &&
    !entry.module._meta?.expanderOf,
  );
}

// Escape hatch for tooling (dev scripts, audits) that genuinely needs the full set.
export function getAllModulesIncludingDrafts(): Entry[] {
  return loadAll();
}

export function getModuleBySlug(slug: string): Module | undefined {
  // Use the full set so direct URLs to expander pages still resolve when linked.
  return loadAll().find((entry) => entry.slug === slug)?.module;
}

// Expanders belonging to a parent slug — verified only, sorted by name for stable render.
export function getExpandersFor(parentSlug: string): Module[] {
  return loadAll()
    .filter((entry) =>
      entry.module._meta?.verified === true &&
      entry.module._meta?.expanderOf === parentSlug,
    )
    .map((entry) => entry.module)
    .sort((a, b) => a.name.localeCompare(b.name));
}
