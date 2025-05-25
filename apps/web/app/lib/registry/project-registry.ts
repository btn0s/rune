import {
  type IRegistry,
  type NodeDefinition,
  registerCoreProfile,
  DefaultLogger,
  ManualLifecycleEventEmitter,
} from "@rune/behave-graph-core";
import type { RuneConfig, RuneProject } from "../types/project";
import type { IPlatform } from "../platform/types";
import { ReactPlatform } from "../platform/react";
import { projectNodes } from "./project-nodes";
import {
  createFigmaImporter,
  type FigmaImporter,
} from "../figma/figma-importer";

export interface ProjectRegistryDependencies {
  ILogger: any;
  ILifecycleEventEmitter: any;
  IPlatform: IPlatform;
  IProjectManager: ProjectManager;
  IFigmaImporter?: FigmaImporter;
}

export interface ProjectManager {
  getCurrentProject(): RuneProject | null;
  saveProject(project: RuneProject): Promise<void>;
  loadProject(id: string): Promise<RuneProject | null>;
  updateProjectGraph(projectId: string, graph: any): Promise<void>;
}

export function createProjectRegistry(
  projectConfig: RuneConfig,
  projectManager: ProjectManager,
  figmaImporter?: FigmaImporter
): IRegistry {
  // Start with core registry
  const coreRegistry = registerCoreProfile({
    values: {},
    nodes: {},
    dependencies: {
      ILogger: new DefaultLogger(),
      ILifecycleEventEmitter: new ManualLifecycleEventEmitter(),
    },
  });

  // Create platform instance
  const platform = createPlatformInstance(projectConfig);

  // Create or get Figma importer
  const figmaImporterInstance = figmaImporter || createFigmaImporter();

  // Create project-specific dependencies
  const projectDependencies = {
    IPlatform: platform,
    IProjectManager: projectManager,
    IFigmaImporter: figmaImporterInstance,
  };

  // Convert project nodes array to object
  const projectNodesMap = Object.fromEntries(
    projectNodes.map((node) => [node.typeName, node])
  );

  // Extend registry with project capabilities
  const projectRegistry = {
    ...coreRegistry,
    nodes: {
      ...coreRegistry.nodes,
      ...projectNodesMap,
    },
    dependencies: {
      ...coreRegistry.dependencies,
      ...projectDependencies,
    },
  };

  return projectRegistry;
}

export function createPlatformInstance(projectConfig: RuneConfig): IPlatform {
  // For now, we only support React
  // In the future, this will be a factory that creates different platform instances
  const platformType = Object.keys(projectConfig.rune.platform)[0];

  switch (platformType) {
    case "react":
      return new ReactPlatform();
    case "swiftui":
      throw new Error("SwiftUI platform not yet implemented");
    case "flutter":
      throw new Error("Flutter platform not yet implemented");
    default:
      throw new Error(`Unsupported platform: ${platformType}`);
  }
}

// Backward compatibility function for existing behave-graph demo
export function createLegacyRegistry(): IRegistry {
  return registerCoreProfile({
    values: {},
    nodes: {},
    dependencies: {
      ILogger: new DefaultLogger(),
      ILifecycleEventEmitter: new ManualLifecycleEventEmitter(),
    },
  });
}

// Helper to check if a registry has project capabilities
export function isProjectRegistry(registry: IRegistry): boolean {
  return "IPlatform" in registry.dependencies;
}

// Helper to get platform from registry
export function getPlatformFromRegistry(registry: IRegistry): IPlatform | null {
  if (!isProjectRegistry(registry)) return null;
  return (registry.dependencies as unknown as ProjectRegistryDependencies)
    .IPlatform;
}

// Helper to get project manager from registry
export function getProjectManagerFromRegistry(
  registry: IRegistry
): ProjectManager | null {
  if (!isProjectRegistry(registry)) return null;
  return (registry.dependencies as unknown as ProjectRegistryDependencies)
    .IProjectManager;
}
