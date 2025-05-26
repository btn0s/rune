// Figma API client for Rune project
// Based on the MCP Figma project but adapted for our needs

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  characters?: string;
  children?: FigmaNode[];
  fills?: Array<{
    type: string;
    color?: { r: number; g: number; b: number };
    opacity?: number;
    [key: string]: any;
  }>;
  strokes?: Array<{
    type: string;
    color?: { r: number; g: number; b: number };
    [key: string]: any;
  }>;
  effects?: Array<{
    type: string;
    visible?: boolean;
    offset?: { x: number; y: number };
    radius?: number;
    [key: string]: any;
  }>;
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  cornerRadius?: number;
  strokeWeight?: number;
  style?: {
    fontSize?: number;
    fontWeight?: number;
    lineHeight?: number;
    letterSpacing?: number;
    textAlignHorizontal?: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
    [key: string]: any;
  };
  // Auto-layout properties
  layoutMode?: "HORIZONTAL" | "VERTICAL";
  itemSpacing?: number;
  paddingLeft?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  primaryAxisAlignItems?: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
  counterAxisAlignItems?: "MIN" | "CENTER" | "MAX";
  [key: string]: any;
}

export interface GetFileResponse {
  document: FigmaNode & {
    id: string;
    name: string;
    type: string;
    children: FigmaNode[];
  };
  components: Record<string, any>;
  styles: Record<string, any>;
  [key: string]: any;
}

export interface GetFileNodesResponse {
  nodes: Record<
    string,
    {
      document: FigmaNode;
      components?: Record<string, any>;
      styles?: Record<string, any>;
      [key: string]: any;
    }
  >;
}

export class FigmaClient {
  private token: string;
  private baseUrl = "https://api.figma.com/v1";

  constructor(token: string) {
    this.token = token;
  }

  async getFile(fileKey: string): Promise<GetFileResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/files/${fileKey}`, {
        headers: {
          "X-Figma-Token": this.token,
        },
      });

      if (!response.ok) {
        throw new Error(`Figma API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(
        `Failed to fetch Figma file: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async getFileNodes(
    fileKey: string,
    nodeIds: string[]
  ): Promise<GetFileNodesResponse> {
    try {
      const url = new URL(`${this.baseUrl}/files/${fileKey}/nodes`);
      url.searchParams.set("ids", nodeIds.join(","));

      const response = await fetch(url.toString(), {
        headers: {
          "X-Figma-Token": this.token,
        },
      });

      if (!response.ok) {
        throw new Error(`Figma API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(
        `Failed to fetch Figma nodes: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async getImageFills(
    fileKey: string,
    nodeIds: string[]
  ): Promise<Record<string, string>> {
    try {
      const url = new URL(`${this.baseUrl}/images/${fileKey}`);
      url.searchParams.set("ids", nodeIds.join(","));
      url.searchParams.set("format", "png");

      const response = await fetch(url.toString(), {
        headers: {
          "X-Figma-Token": this.token,
        },
      });

      if (!response.ok) {
        throw new Error(`Figma API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.images || {};
    } catch (error) {
      throw new Error(
        `Failed to fetch Figma images: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  // Helper method to extract file key from Figma URL
  static extractFileKey(figmaUrl: string): string | null {
    // Handle both /file/ and /design/ patterns
    const match = figmaUrl.match(/(?:file|design)\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  // Helper method to extract node ID from Figma URL
  static extractNodeId(figmaUrl: string): string | null {
    const match = figmaUrl.match(/node-id=([^&]+)/);
    if (match) {
      // Convert dashes to colons for Figma API
      return decodeURIComponent(match[1]).replace(/-/g, ":");
    }
    return null;
  }
}
