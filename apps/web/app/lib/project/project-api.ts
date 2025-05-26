import type { ProjectConfig } from "./project-generator";
import type { ComponentData } from "../figma/component-generator";

export interface CreateProjectRequest {
  name: string;
  description?: string;
  figmaUrl?: string;
  components?: ComponentData[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  project?: ProjectConfig;
  projects?: ProjectConfig[];
  port?: number;
  error?: string;
}

class ProjectApiClient {
  private baseUrl = "http://localhost:3002/api";

  async createProject(request: CreateProjectRequest): Promise<ProjectConfig> {
    const response = await fetch(`${this.baseUrl}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    const result: ApiResponse = await response.json();

    if (!result.success || !result.project) {
      throw new Error(result.error || "Failed to create project");
    }

    return result.project;
  }

  async listProjects(): Promise<ProjectConfig[]> {
    const response = await fetch(`${this.baseUrl}/projects`);
    const result: ApiResponse = await response.json();

    if (!result.success || !result.projects) {
      throw new Error(result.error || "Failed to list projects");
    }

    return result.projects;
  }

  async startProject(projectId: string): Promise<number> {
    const response = await fetch(
      `${this.baseUrl}/projects/${projectId}/start`,
      {
        method: "POST",
      }
    );

    const result: ApiResponse = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to start project");
    }

    if (typeof result.port !== "number") {
      throw new Error("port is not defined");
    }

    return result.port;
  }

  async stopProject(projectId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/stop`, {
      method: "POST",
    });

    const result: ApiResponse = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to stop project");
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}`, {
      method: "DELETE",
    });

    const result: ApiResponse = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to delete project");
    }
  }

  async updateProjectComponents(
    projectId: string,
    components: ComponentData[]
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/projects/${projectId}/components`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ components }),
      }
    );

    const result: ApiResponse = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to update project components");
    }
  }
}

export const projectApi = new ProjectApiClient();
