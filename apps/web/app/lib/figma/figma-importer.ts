import { FigmaClient } from "./figma-client";
import {
  generateComponentsFromNodes,
  findComponentNodes,
  type ComponentData,
} from "./component-generator";

export interface FigmaImportResult {
  success: boolean;
  components: ComponentData[];
  error?: string;
}

export class FigmaImporter {
  private client: FigmaClient;

  constructor(figmaToken: string) {
    this.client = new FigmaClient(figmaToken);
  }

  async importFromUrl(figmaUrl: string): Promise<FigmaImportResult> {
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

      if (nodeId) {
        console.log("Importing specific node:", nodeId);
        // Import specific node
        return await this.importSpecificNode(fileKey, nodeId);
      } else {
        console.log("Importing entire file");
        // Import entire file
        return await this.importEntireFile(fileKey);
      }
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
    // TODO: Implement sync functionality
    console.log(`Syncing components for project ${projectId}`);
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
