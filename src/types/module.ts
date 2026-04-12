export interface Control {
  name: string;
  scope: string;
  description: string;
  detail: string;
}

export interface IO {
  name: string;
  description: string;
  voltage?: string;
  normalizedTo?: string;
}

export interface Behavior {
  name: string;
  trigger: string;
  description: string;
}

export interface PatchIdea {
  name: string;
  patch: string;
  diagram?: string;
}

export interface ModuleMeta {
  schemaVersion: number;
  generatedAt?: string;
  verified: boolean;
  firmwareVersion?: string;
  sources?: string[];
  expanderOf?: string;
}

export interface Module {
  _meta: ModuleMeta;
  slug: string;
  name: string;
  manufacturer: string;
  hp: number;
  tags: string[];
  description: string;
  controls: Control[];
  inputs: IO[];
  outputs: IO[];
  behaviors: Behavior[];
  patchIdeas: PatchIdea[];
}

export interface RackRow {
  label: string;
  is1u?: boolean;
  modules: string[];
}

export interface Rack {
  name: string;
  specs: string;
  rows: RackRow[];
}

export interface RacksData {
  racks: Rack[];
}
