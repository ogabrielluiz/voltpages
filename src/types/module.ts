export interface Control {
  name: string;
  scope: string;
  description: string;
  detail: string;
}

export type SignalType = "cv" | "gate" | "audio" | "env" | "clk";

export interface IO {
  name: string;
  description: string;
  voltage?: string;
  normalizedTo?: string;
  signalType?: SignalType;
}

export interface Behavior {
  name: string;
  trigger: string;
  description: string;
}

export type PatchDifficulty = "essential" | "intermediate" | "advanced";
export type PatchIntent = "envelope" | "lfo" | "utility" | "audio-rate" | "generative";
export type PatchSignalType = "cv" | "gate" | "audio";

export interface PatchIdea {
  name: string;
  patch: string;
  diagram?: string;
  steps?: string[];
  signalOut?: string;
  hear?: string;
  difficulty?: PatchDifficulty;
  intent?: PatchIntent | PatchIntent[];
  signalType?: PatchSignalType;
  essential?: boolean;
}

export interface ModuleMeta {
  schemaVersion: number;
  generatedAt?: string;
  verified: boolean;
  firmwareVersion?: string;
  sources?: string[];
  expanderOf?: string;
  hidden?: boolean;
}

export interface Module {
  _meta: ModuleMeta;
  slug: string;
  name: string;
  manufacturer: string;
  hp: number;
  tags: string[];
  description: string;
  role?: string;
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
