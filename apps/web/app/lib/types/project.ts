import type { GraphJSON } from "@rune/behave-graph-core";

// Core project configuration schema (rune.json)
export interface RuneConfig {
  name: string;
  version: string;
  description?: string;
  rune: {
    version: string;
    studio: {
      graphFile: string;
      componentsDir: string;
      outputDir: string;
    };
    figma?: {
      fileKey: string;
      nodeIds: string[];
      lastSync?: string;
    };
    platform: {
      react?: {
        framework: "remix" | "next" | "vite";
        uiLibrary: "shadcn" | "chakra" | "mantine";
        outputFormat: "tsx" | "jsx";
      };
      swiftui?: {
        version: string;
        deployment: string;
      };
      flutter?: {
        version: string;
        platform: string;
      };
    };
  };
  dependencies: Record<string, string>;
}

// Runtime project data
export interface RuneProject {
  id: string;
  name: string;
  description?: string;
  platform: string;
  graph: GraphJSON;
  components: ProjectComponent[];
  figmaComponents: FigmaComponent[];
  config: RuneConfig;
  createdAt: string;
  updatedAt: string;
  isTemplate?: boolean;
}

// Project component metadata
export interface ProjectComponent {
  id: string;
  name: string;
  type: "figma" | "custom" | "template";
  metadata: {
    figmaNodeId?: string;
    filePath?: string;
    category?: string;
    tags?: string[];
  };
  properties: ComponentProperty[];
}

// Figma component data
export interface FigmaComponent {
  id: string;
  name: string;
  nodeId: string;
  type: string;
  properties: ComponentProperty[];
  metadata: {
    figmaFileKey: string;
    lastSync: string;
    imageUrl?: string;
  };
}

// Component property definition
export interface ComponentProperty {
  name: string;
  type: "string" | "number" | "boolean" | "color" | "image";
  defaultValue?: any;
  required?: boolean;
  description?: string;
}

// Project template for quick creation
export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  platform: string;
  graph: GraphJSON;
  config: Partial<RuneConfig>;
  thumbnail?: string;
  category: "starter" | "example" | "demo";
}

// Project creation options
export interface CreateProjectOptions {
  name: string;
  description?: string;
  platform: string;
  template?: string;
  figmaFileKey?: string;
  figmaNodeIds?: string[];
}

// Project persistence interface
export interface ProjectStorage {
  listProjects(): Promise<RuneProject[]>;
  getProject(id: string): Promise<RuneProject | null>;
  saveProject(project: RuneProject): Promise<void>;
  deleteProject(id: string): Promise<void>;
  createProject(options: CreateProjectOptions): Promise<RuneProject>;
  importProject(config: RuneConfig): Promise<RuneProject>;
  exportProject(id: string): Promise<{ config: RuneConfig; graph: GraphJSON }>;
  listTemplates(): Promise<ProjectTemplate[]>;
  getTemplate(id: string): Promise<ProjectTemplate | null>;
}
