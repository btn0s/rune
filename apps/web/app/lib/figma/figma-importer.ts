import { FigmaClient } from "./figma-client";
import {
  generateComponentsFromNodes,
  findComponentNodes,
  type ComponentData,
} from "./component-generator";
import { projectApi, type CreateProjectRequest } from "../project/project-api";
import type { ProjectConfig } from "../project/project-generator";

export interface FigmaImportResult {
  success: boolean;
  components: ComponentData[];
  project?: ProjectConfig;
  error?: string;
}

export interface FigmaImportOptions {
  createProject?: boolean;
  projectName?: string;
  projectDescription?: string;
  startDevServer?: boolean;
}

export class FigmaImporter {
  private client: FigmaClient;

  constructor(figmaToken: string) {
    this.client = new FigmaClient(figmaToken);
  }

  async importFromUrl(
    figmaUrl: string,
    options: FigmaImportOptions = {}
  ): Promise<FigmaImportResult> {
    try {
      console.log("FigmaImporter.importFromUrl called with:", figmaUrl);

      // Extract file key from URL
      const fileKey = FigmaClient.extractFileKey(figmaUrl);
      console.log("Extracted fileKey:", fileKey);

      if (!fileKey) {
        console.log("No fileKey found, returning error");
        return {
          success: false,
          components: [],
          error: "Invalid Figma URL format",
        };
      }

      // Check if URL contains specific node ID
      const nodeId = FigmaClient.extractNodeId(figmaUrl);
      console.log("Extracted nodeId:", nodeId);

      let components: ComponentData[];

      if (nodeId) {
        console.log("Importing specific node:", nodeId);
        // Import specific node
        const result = await this.importSpecificNode(fileKey, nodeId);
        if (!result.success) {
          return result;
        }
        components = result.components;
      } else {
        console.log("Importing entire file");
        // Import entire file
        const result = await this.importEntireFile(fileKey);
        if (!result.success) {
          return result;
        }
        components = result.components;
      }

      // Create project if requested
      let project: ProjectConfig | undefined;
      if (options.createProject && components.length > 0) {
        const createRequest: CreateProjectRequest = {
          name: options.projectName || "Figma Import",
          description:
            options.projectDescription || `Imported from ${figmaUrl}`,
          figmaUrl,
          components,
        };

        project = await projectApi.createProject(createRequest);

        // Start dev server if requested
        if (options.startDevServer) {
          await projectApi.startProject(project.id);
          project.status = "running";
        }
      }

      return {
        success: true,
        components,
        project,
      };
    } catch (error) {
      console.error("Error in importFromUrl:", error);
      return {
        success: false,
        components: [],
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  private async importSpecificNode(
    fileKey: string,
    nodeId: string
  ): Promise<FigmaImportResult> {
    try {
      console.log(
        `Importing specific node: fileKey=${fileKey}, nodeId=${nodeId}`
      );
      const response = await this.client.getFileNodes(fileKey, [nodeId]);
      console.log("API response:", response);

      const nodeData = response.nodes[nodeId];
      console.log("Node data:", nodeData);

      if (!nodeData) {
        console.log("Node not found in response");
        return {
          success: false,
          components: [],
          error: "Node not found",
        };
      }

      console.log("Generating components from node...");
      const components = generateComponentsFromNodes([nodeData.document]);
      console.log("Generated components:", components);

      return {
        success: true,
        components,
      };
    } catch (error) {
      console.error("Error in importSpecificNode:", error);
      return {
        success: false,
        components: [],
        error: error instanceof Error ? error.message : "Failed to import node",
      };
    }
  }

  private async importEntireFile(fileKey: string): Promise<FigmaImportResult> {
    try {
      const response = await this.client.getFile(fileKey);

      // Find interesting component nodes in the document
      const componentNodes = findComponentNodes(response.document);

      if (componentNodes.length === 0) {
        return {
          success: false,
          components: [],
          error: "No components found in the Figma file",
        };
      }

      // Limit to first 10 components to avoid overwhelming the system
      const limitedNodes = componentNodes.slice(0, 10);
      const components = generateComponentsFromNodes(limitedNodes);

      return {
        success: true,
        components,
      };
    } catch (error) {
      return {
        success: false,
        components: [],
        error: error instanceof Error ? error.message : "Failed to import file",
      };
    }
  }

  async importComponents(
    fileKey: string,
    nodeIds: string[]
  ): Promise<ComponentData[]> {
    try {
      const response = await this.client.getFileNodes(fileKey, nodeIds);
      const nodes = Object.values(response.nodes).map((node) => node.document);
      return generateComponentsFromNodes(nodes);
    } catch (error) {
      console.error("Failed to import components:", error);
      return [];
    }
  }

  async syncComponents(projectId: string): Promise<void> {
    // Implementation would sync components from Figma to existing project
    throw new Error("Not implemented yet");
  }

  async listProjects(): Promise<ProjectConfig[]> {
    return projectApi.listProjects();
  }

  async startProject(projectId: string): Promise<void> {
    await projectApi.startProject(projectId);
  }

  async stopProject(projectId: string): Promise<void> {
    await projectApi.stopProject(projectId);
  }

  async deleteProject(projectId: string): Promise<void> {
    await projectApi.deleteProject(projectId);
  }

  async updateProjectComponents(
    projectId: string,
    components: ComponentData[]
  ): Promise<void> {
    await projectApi.updateProjectComponents(projectId, components);
  }

  private generateProjectId(baseName: string): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const cleanName = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    return `${cleanName}-${timestamp}-${randomSuffix}`;
  }
}

// Environment variable helper
export function createFigmaImporter(): FigmaImporter | null {
  // In the browser, only check localStorage
  const figmaToken =
    typeof window !== "undefined" ? localStorage.getItem("figma_token") : null;

  if (!figmaToken) {
    console.warn(
      "No Figma token found. Please configure your token in the settings panel."
    );
    return null;
  }

  return new FigmaImporter(figmaToken);
}
