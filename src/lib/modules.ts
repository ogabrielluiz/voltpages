import type { Module } from '../types/module';

const moduleFiles = import.meta.glob<Module>('../data/modules/*.json', { eager: true, import: 'default' });

export function getAllModules(): { slug: string; module: Module }[] {
  return Object.entries(moduleFiles).map(([path, module]) => {
    const filename = path.split('/').pop()!.replace('.json', '');
    return { slug: module.slug || filename, module };
  });
}

export function getModuleBySlug(slug: string): Module | undefined {
  const all = getAllModules();
  return all.find((entry) => entry.slug === slug)?.module;
}
