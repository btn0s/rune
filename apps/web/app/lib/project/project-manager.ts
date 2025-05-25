import type { RuneProject, RuneConfig } from "../types/project";
import type { ProjectManager } from "../registry/project-registry";
import type { GraphJSON } from "@rune/behave-graph-core";
import { getProjectStorage } from "../storage/project-storage";
import type { ProjectStorage } from "../types/project";

export class ProjectManagerImpl implements ProjectManager {
  private currentProject: RuneProject | null = null;
  private storage: ProjectStorage | null = null;

  constructor(initialProject?: RuneProject) {
    this.currentProject = initialProject || null;
    this.initializeStorage();
  }

  private async initializeStorage() {
    this.storage = await getProjectStorage();
  }

  private async getStorage(): Promise<ProjectStorage> {
    if (!this.storage) {
      this.storage = await getProjectStorage();
    }
    return this.storage;
  }

  getCurrentProject(): RuneProject | null {
    return this.currentProject;
  }

  setCurrentProject(project: RuneProject | null): void {
    this.currentProject = project;
  }

  async saveProject(project: RuneProject): Promise<void> {
    // Update the current project if it's the same one
    if (this.currentProject?.id === project.id) {
      this.currentProject = project;
    }

    // Save to storage
    const storage = await this.getStorage();
    await storage.saveProject(project);
  }

  async loadProject(id: string): Promise<RuneProject | null> {
    const storage = await this.getStorage();
    const project = await storage.getProject(id);

    if (project) {
      this.currentProject = project;
    }

    return project;
  }

  async updateProjectGraph(projectId: string, graph: GraphJSON): Promise<void> {
    const storage = await this.getStorage();
    const project = await storage.getProject(projectId);

    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const updatedProject: RuneProject = {
      ...project,
      graph,
      updatedAt: new Date().toISOString(),
    };

    await this.saveProject(updatedProject);
  }

  async updateProjectConfig(
    projectId: string,
    config: Partial<RuneConfig>
  ): Promise<void> {
    const storage = await this.getStorage();
    const project = await storage.getProject(projectId);

    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const updatedProject: RuneProject = {
      ...project,
      config: { ...project.config, ...config },
      updatedAt: new Date().toISOString(),
    };

    await this.saveProject(updatedProject);
  }

  async addComponent(projectId: string, component: any): Promise<void> {
    const storage = await this.getStorage();
    const project = await storage.getProject(projectId);

    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const updatedProject: RuneProject = {
      ...project,
      components: [...project.components, component],
      updatedAt: new Date().toISOString(),
    };

    await this.saveProject(updatedProject);
  }

  async removeComponent(projectId: string, componentId: string): Promise<void> {
    const storage = await this.getStorage();
    const project = await storage.getProject(projectId);

    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const updatedProject: RuneProject = {
      ...project,
      components: project.components.filter((c: any) => c.id !== componentId),
      updatedAt: new Date().toISOString(),
    };

    await this.saveProject(updatedProject);
  }

  async updateComponent(
    projectId: string,
    componentId: string,
    updates: any
  ): Promise<void> {
    const storage = await this.getStorage();
    const project = await storage.getProject(projectId);

    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const updatedProject: RuneProject = {
      ...project,
      components: project.components.map((c: any) =>
        c.id === componentId ? { ...c, ...updates } : c
      ),
      updatedAt: new Date().toISOString(),
    };

    await this.saveProject(updatedProject);
  }

  // Helper methods for project state management
  async getProjectComponents(projectId?: string): Promise<any[]> {
    const project = projectId
      ? await (await this.getStorage()).getProject(projectId)
      : this.currentProject;

    return project?.components || [];
  }

  async getProjectConfig(projectId?: string): Promise<RuneConfig | null> {
    const project = projectId
      ? await (await this.getStorage()).getProject(projectId)
      : this.currentProject;

    return project?.config || null;
  }

  async getProjectGraph(projectId?: string): Promise<GraphJSON | null> {
    const project = projectId
      ? await (await this.getStorage()).getProject(projectId)
      : this.currentProject;

    return project?.graph || null;
  }

  // Event system for project changes
  private listeners = new Map<string, ((project: RuneProject) => void)[]>();

  onProjectChange(
    event: string,
    callback: (project: RuneProject) => void
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  offProjectChange(
    event: string,
    callback: (project: RuneProject) => void
  ): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;

    const index = eventListeners.indexOf(callback);
    if (index > -1) {
      eventListeners.splice(index, 1);
    }
  }

  private emitProjectChange(event: string, project: RuneProject): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;

    eventListeners.forEach((callback) => {
      try {
        callback(project);
      } catch (error) {
        console.error("Error in project change listener:", error);
      }
    });
  }

  // Override saveProject to emit events
  async saveProjectWithEvents(project: RuneProject): Promise<void> {
    await this.saveProject(project);
    this.emitProjectChange("project:saved", project);

    if (this.currentProject?.id === project.id) {
      this.emitProjectChange("project:updated", project);
    }
  }
}
