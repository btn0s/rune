import type {
  RuneProject,
  RuneConfig,
  ProjectStorage,
  CreateProjectOptions,
  ProjectTemplate,
} from "../types/project";
import type { GraphJSON } from "@rune/behave-graph-core";
import type { ProjectConfig } from "../project/project-generator";

// Storage implementation that facades over the Generator System
// Updated: 2025-01-25 - Using correct API port 3002
class GeneratorProjectStorage implements ProjectStorage {
  private baseUrl = "http://localhost:3002/api";

  async listProjects(): Promise<RuneProject[]> {
    try {
      const response = await fetch(`${this.baseUrl}/projects`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to list projects");
      }

      // Convert ProjectConfig[] to RuneProject[]
      const projects: RuneProject[] = [];
      for (const projectConfig of data.projects) {
        const runeProject = await this.convertToRuneProject(projectConfig);
        projects.push(runeProject);
      }

      return projects;
    } catch (error) {
      console.error("Failed to list projects:", error);
      return [];
    }
  }

  async getProject(id: string): Promise<RuneProject | null> {
    try {
      // Get project metadata
      const projectsResponse = await fetch(`${this.baseUrl}/projects`);
      const projectsData = await projectsResponse.json();

      if (!projectsData.success) {
        throw new Error(projectsData.error || "Failed to get projects");
      }

      const projectConfig = projectsData.projects.find(
        (p: ProjectConfig) => p.id === id
      );
      if (!projectConfig) {
        return null;
      }

      return await this.convertToRuneProject(projectConfig);
    } catch (error) {
      console.error("Failed to get project:", error);
      return null;
    }
  }

  async saveProject(project: RuneProject): Promise<void> {
    try {
      // Save the graph
      const graphResponse = await fetch(
        `${this.baseUrl}/projects/${project.id}/graph`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ graph: project.graph }),
        }
      );

      if (!graphResponse.ok) {
        throw new Error("Failed to save project graph");
      }

      // Save the config
      const configResponse = await fetch(
        `${this.baseUrl}/projects/${project.id}/config`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config: project.config }),
        }
      );

      if (!configResponse.ok) {
        throw new Error("Failed to save project config");
      }
    } catch (error) {
      console.error("Failed to save project:", error);
      throw error;
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/projects/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
      throw error;
    }
  }

  async createProject(options: CreateProjectOptions): Promise<RuneProject> {
    try {
      const response = await fetch(`${this.baseUrl}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: options.name,
          description: options.description,
          figmaUrl: options.figmaFileKey
            ? `https://www.figma.com/file/${options.figmaFileKey}/`
            : undefined,
          components: [],
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to create project");
      }

      return await this.convertToRuneProject(data.project);
    } catch (error) {
      console.error("Failed to create project:", error);
      throw error;
    }
  }

  async importProject(config: RuneConfig): Promise<RuneProject> {
    // Create a project from the config
    const project = await this.createProject({
      name: config.name,
      description: config.description,
      platform: Object.keys(config.rune.platform)[0],
    });

    // Update with the imported config
    await this.saveProject({
      ...project,
      config,
    });

    return project;
  }

  async exportProject(
    id: string
  ): Promise<{ config: RuneConfig; graph: GraphJSON }> {
    const project = await this.getProject(id);
    if (!project) {
      throw new Error("Project not found");
    }

    return {
      config: project.config,
      graph: project.graph,
    };
  }

  async listTemplates(): Promise<ProjectTemplate[]> {
    // For now, return empty array - templates could be implemented later
    return [];
  }

  async getTemplate(id: string): Promise<ProjectTemplate | null> {
    // For now, return null - templates could be implemented later
    return null;
  }

  // Helper method to convert ProjectConfig to RuneProject
  private async convertToRuneProject(
    projectConfig: ProjectConfig
  ): Promise<RuneProject> {
    try {
      // Get the project's config and graph
      const [configResponse, graphResponse] = await Promise.all([
        fetch(`${this.baseUrl}/projects/${projectConfig.id}/config`),
        fetch(`${this.baseUrl}/projects/${projectConfig.id}/graph`),
      ]);

      const configData = await configResponse.json();
      const graphData = await graphResponse.json();

      const config: RuneConfig = configData.success
        ? configData.config
        : this.createDefaultConfig(projectConfig);
      const graph: GraphJSON = graphData.success
        ? graphData.graph
        : { nodes: [], variables: [], customEvents: [] };

      // Convert ComponentData[] to ProjectComponent[]
      const components = projectConfig.components.map((comp) => ({
        id: comp.id || comp.name,
        name: comp.name,
        type: "figma" as const,
        metadata: {
          figmaNodeId: comp.id,
          category: comp.type,
          tags: [],
        },
        properties: Object.entries(comp.properties || {}).map(
          ([name, value]) => ({
            name,
            type: (typeof value === "string"
              ? "string"
              : typeof value === "number"
                ? "number"
                : typeof value === "boolean"
                  ? "boolean"
                  : "string") as any,
            defaultValue: value,
            description: `Property ${name} from Figma component`,
          })
        ),
      }));

      const runeProject: RuneProject = {
        id: projectConfig.id,
        name: projectConfig.name,
        description: projectConfig.description,
        platform: "react", // Default to react for now
        graph,
        components,
        figmaComponents: [], // Could be populated from components if needed
        config,
        createdAt: new Date().toISOString(), // We don't have this from ProjectConfig
        updatedAt: new Date().toISOString(),
      };

      return runeProject;
    } catch (error) {
      console.error("Failed to convert ProjectConfig to RuneProject:", error);
      throw error;
    }
  }

  private createDefaultConfig(projectConfig: ProjectConfig): RuneConfig {
    return {
      name: projectConfig.name,
      version: "1.0.0",
      description: projectConfig.description,
      rune: {
        version: "0.1.0",
        studio: {
          graphFile: "./app/app.graph.json",
          componentsDir: "./app/components",
          outputDir: "./app/generated",
        },
        figma: projectConfig.figmaUrl
          ? {
              fileKey: this.extractFigmaFileKey(projectConfig.figmaUrl),
              nodeIds: [],
              lastSync: new Date().toISOString(),
            }
          : undefined,
        platform: {
          react: {
            framework: "remix",
            uiLibrary: "shadcn",
            outputFormat: "tsx",
          },
        },
      },
      dependencies: {
        "@rune/runtime-react": "^0.1.0",
      },
    };
  }

  private extractFigmaFileKey(figmaUrl: string): string {
    const match = figmaUrl.match(/\/file\/([a-zA-Z0-9]+)/);
    return match ? match[1] : "";
  }
}

// Singleton instance
let projectStorage: ProjectStorage | null = null;

export async function getProjectStorage(): Promise<ProjectStorage> {
  if (!projectStorage) {
    projectStorage = new GeneratorProjectStorage();
  }
  return projectStorage;
}
