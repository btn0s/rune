import type { StylePreset } from "./types";
import { ambrookWarm } from "./ambrook-warm";

export type { StylePreset } from "./types";

const presets = new Map<string, StylePreset>();

function register(preset: StylePreset): void {
  presets.set(preset.name, preset);
}

register(ambrookWarm);

export function getPreset(name: string): StylePreset | undefined {
  return presets.get(name);
}

export function listPresets(): string[] {
  return Array.from(presets.keys());
}
