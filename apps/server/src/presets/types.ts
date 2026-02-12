export interface ColorToken {
  hex: string;
  description: string;
}

export interface TypeToken {
  fontSize: number;
  fontWeight: number;
  description: string;
}

export interface SpacingToken {
  value: number;
  description: string;
}

export interface RadiusToken {
  value: number;
  description: string;
}

export interface ShadowToken {
  offsetX: number;
  offsetY: number;
  blurRadius: number;
  color: string;
  description: string;
}

export interface RoleDefinition {
  tokens: string[];
  description: string;
}

export interface StylePreset {
  name: string;
  description: string;
  font: string;
  colors: Record<string, ColorToken>;
  typeScale: Record<string, TypeToken>;
  spacing: Record<string, SpacingToken>;
  radii: Record<string, RadiusToken>;
  shadows: Record<string, ShadowToken>;
  roles: Record<string, RoleDefinition>;
}
