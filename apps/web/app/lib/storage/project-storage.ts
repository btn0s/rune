import type { GraphJSON } from "@rune/behave-graph-core";
import type {
  RuneProject,
  RuneConfig,
  CreateProjectOptions,
  ProjectStorage,
  ProjectTemplate,
} from "../types/project";
import { createDefaultTemplates } from "./project-templates";

const DB_NAME = "rune-projects";
const DB_VERSION = 1;
const PROJECTS_STORE = "projects";
const TEMPLATES_STORE = "templates";

class IndexedDBProjectStorage implements ProjectStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create projects store
        if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
          const projectStore = db.createObjectStore(PROJECTS_STORE, {
            keyPath: "id",
          });
          projectStore.createIndex("platform", "platform", { unique: false });
          projectStore.createIndex("createdAt", "createdAt", { unique: false });
        }

        // Create templates store
        if (!db.objectStoreNames.contains(TEMPLATES_STORE)) {
          const templateStore = db.createObjectStore(TEMPLATES_STORE, {
            keyPath: "id",
          });
          templateStore.createIndex("category", "category", { unique: false });
          templateStore.createIndex("platform", "platform", { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error("Failed to initialize database");
    }
    return this.db;
  }

  async listProjects(): Promise<RuneProject[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROJECTS_STORE], "readonly");
      const store = transaction.objectStore(PROJECTS_STORE);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const projects = request.result as RuneProject[];
        // Sort by most recently updated
        projects.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        resolve(projects);
      };
    });
  }

  async getProject(id: string): Promise<RuneProject | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROJECTS_STORE], "readonly");
      const store = transaction.objectStore(PROJECTS_STORE);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async saveProject(project: RuneProject): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROJECTS_STORE], "readwrite");
      const store = transaction.objectStore(PROJECTS_STORE);

      // Update timestamp
      const updatedProject = {
        ...project,
        updatedAt: new Date().toISOString(),
      };

      const request = store.put(updatedProject);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async deleteProject(id: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROJECTS_STORE], "readwrite");
      const store = transaction.objectStore(PROJECTS_STORE);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async createProject(options: CreateProjectOptions): Promise<RuneProject> {
    const id = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Get template if specified
    let templateGraph: GraphJSON | undefined;
    if (options.template) {
      const template = await this.getTemplate(options.template);
      templateGraph = template?.graph;
    }

    // Create default config
    const config: RuneConfig = {
      name: options.name,
      version: "1.0.0",
      description: options.description,
      rune: {
        version: "0.1.0",
        studio: {
          graphFile: "./src/app.graph.json",
          componentsDir: "./src/components",
          outputDir: "./src/generated",
        },
        figma: options.figmaFileKey
          ? {
              fileKey: options.figmaFileKey,
              nodeIds: options.figmaNodeIds || [],
              lastSync: now,
            }
          : undefined,
        platform: {
          react:
            options.platform === "react"
              ? {
                  framework: "remix",
                  uiLibrary: "shadcn",
                  outputFormat: "tsx",
                }
              : undefined,
        },
      },
      dependencies: {
        "@rune/runtime-react": "^0.1.0",
      },
    };

    const project: RuneProject = {
      id,
      name: options.name,
      description: options.description,
      platform: options.platform,
      graph: templateGraph || { nodes: [], variables: [], customEvents: [] },
      components: [],
      figmaComponents: [],
      config,
      createdAt: now,
      updatedAt: now,
    };

    await this.saveProject(project);
    return project;
  }

  async importProject(config: RuneConfig): Promise<RuneProject> {
    const id = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Determine platform from config
    const platform = config.rune.platform.react
      ? "react"
      : config.rune.platform.swiftui
        ? "swiftui"
        : config.rune.platform.flutter
          ? "flutter"
          : "react";

    const project: RuneProject = {
      id,
      name: config.name,
      description: config.description,
      platform,
      graph: { nodes: [], variables: [], customEvents: [] }, // Will be loaded separately
      components: [],
      figmaComponents: [],
      config,
      createdAt: now,
      updatedAt: now,
    };

    await this.saveProject(project);
    return project;
  }

  async exportProject(
    id: string
  ): Promise<{ config: RuneConfig; graph: GraphJSON }> {
    const project = await this.getProject(id);
    if (!project) {
      throw new Error(`Project ${id} not found`);
    }

    return {
      config: project.config,
      graph: project.graph,
    };
  }

  // Template management
  async getTemplate(id: string): Promise<ProjectTemplate | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([TEMPLATES_STORE], "readonly");
      const store = transaction.objectStore(TEMPLATES_STORE);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async listTemplates(): Promise<ProjectTemplate[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([TEMPLATES_STORE], "readonly");
      const store = transaction.objectStore(TEMPLATES_STORE);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as ProjectTemplate[]);
    });
  }

  async initializeTemplates(): Promise<void> {
    const existingTemplates = await this.listTemplates();
    if (existingTemplates.length > 0) return; // Already initialized

    const templates = createDefaultTemplates();
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([TEMPLATES_STORE], "readwrite");
      const store = transaction.objectStore(TEMPLATES_STORE);

      let completed = 0;
      const total = templates.length;

      if (total === 0) {
        resolve();
        return;
      }

      templates.forEach((template: ProjectTemplate) => {
        const request = store.put(template);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
      });
    });
  }
}

// Singleton instance
let storage: IndexedDBProjectStorage | null = null;

export async function getProjectStorage(): Promise<ProjectStorage> {
  if (!storage) {
    storage = new IndexedDBProjectStorage();
    await storage.init();
    await storage.initializeTemplates();
  }
  return storage;
}
