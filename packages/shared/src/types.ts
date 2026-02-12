/**
 * Shared type definitions for Figma plugin and MCP server
 */

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NodeInfo {
  id: string;
  name: string;
  type: string;
  bounds: Bounds;
  fill?: RGBA;
  visible: boolean;
  locked: boolean;
}
