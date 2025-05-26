import { exec, spawn } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import * as net from "net";
import type { ComponentData } from "../figma/component-generator";

const execAsync = promisify(exec);

export interface ProjectConfig {
  id: string;
  name: string;
  description?: string;
  figmaUrl?: string;
  port: number;
  status: "creating" | "ready" | "running" | "error";
  components: ComponentData[];
}

// Rune.json configuration interfaces
export interface RuneConfig {
  name: string;
  version: string;
  description: string;
  platform: string;
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
      lastSync: string;
    };
    platform: {
      react: {
        framework: string;
        uiLibrary: string;
        outputFormat: string;
      };
    };
    project: {
      id: string;
      port: number;
      createdAt: string;
      updatedAt: string;
      components: ProjectComponent[];
    };
  };
  dependencies: Record<string, string>;
}

export interface ProjectComponent {
  id: string;
  name: string;
  type: "figma" | "custom" | "template";
  figmaNodeId?: string;
  graphNodes: string[];
  metadata: Record<string, any>;
}

export class ProjectGenerator {
  private projectsDir: string;
  private basePort = 3001; // Start from 3001 to avoid conflicts with main studio

  constructor(projectsDir: string = "generated-projects") {
    this.projectsDir = path.resolve(projectsDir);
  }

  async createProject(
    config: Omit<ProjectConfig, "port" | "status">
  ): Promise<ProjectConfig> {
    const projectPath = path.join(process.cwd(), this.projectsDir, config.id);
    const port = await this.findAvailablePort();

    const projectConfig: ProjectConfig = {
      ...config,
      port,
      status: "creating",
    };

    try {
      // Ensure projects directory exists
      await fs.mkdir(this.projectsDir, { recursive: true });

      // Create project using React Router template
      console.log(`Creating project at ${projectPath}...`);
      await execAsync(
        `npx create-react-router@latest ${config.id} --template remix-run/react-router-templates/vercel --yes`,
        { cwd: this.projectsDir }
      );

      // Install additional dependencies
      await this.installDependencies(projectPath);

      // Create components directory and initial files
      await this.setupProjectStructure(projectPath, config, port);

      // Generate initial components if provided
      if (config.components.length > 0) {
        await this.writeComponents(projectPath, config.components);
      }

      projectConfig.status = "ready";
      return projectConfig;
    } catch (error) {
      console.error("Error creating project:", error);
      projectConfig.status = "error";
      throw error;
    }
  }

  async startDevServer(projectId: string): Promise<number> {
    const projectPath = path.join(this.projectsDir, projectId);
    const port = await this.findAvailablePort();

    console.log(
      `Starting dev server for ${projectId} at ${projectPath} on port ${port}`
    );

    try {
      // Start Vite dev server in background using spawn with specific port
      const child = spawn(
        "npm",
        ["run", "dev", "--", "--host", "--port", port.toString()],
        {
          cwd: projectPath,
          detached: true,
          stdio: "ignore",
        }
      );

      // Unref the child process so the parent can exit
      child.unref();

      // Store process ID and port for later cleanup
      await fs.writeFile(
        path.join(projectPath, ".dev-server.pid"),
        JSON.stringify({ pid: child.pid, port })
      );

      // Update the project's rune.json with the actual port
      await this.updateProjectPort(projectPath, port);

      console.log(`Dev server started for ${projectId} on port ${port}`);
      return port;
    } catch (error) {
      console.error("Error starting dev server:", error);
      throw error;
    }
  }

  async stopDevServer(projectId: string): Promise<void> {
    const projectPath = path.join(this.projectsDir, projectId);
    const pidFile = path.join(projectPath, ".dev-server.pid");

    try {
      const pidData = await fs.readFile(pidFile, "utf-8");
      if (pidData) {
        let pid: number;
        try {
          // Try parsing as JSON first (new format)
          const parsed = JSON.parse(pidData);
          pid = parsed.pid;
        } catch {
          // Fallback to old format (plain string)
          pid = parseInt(pidData);
        }

        if (pid && !isNaN(pid)) {
          process.kill(pid);
          await fs.unlink(pidFile);
        }
      }
    } catch (error) {
      // PID file might not exist or process already stopped
      console.warn("Could not stop dev server:", error);
    }
  }

  async writeComponents(
    projectPath: string,
    components: ComponentData[]
  ): Promise<void> {
    const componentsDir = path.join(projectPath, "app", "components");
    await fs.mkdir(componentsDir, { recursive: true });

    // Write individual component files
    for (const component of components) {
      const componentFile = path.join(componentsDir, `${component.name}.tsx`);
      await fs.writeFile(componentFile, component.reactCode);
    }

    // Create index file for easy imports
    const indexContent = components
      .map((c) => `export { ${c.name} } from './${c.name}';`)
      .join("\n");

    await fs.writeFile(path.join(componentsDir, "index.ts"), indexContent);

    // Update home route to showcase components with centered preview
    await this.updateHomeRoute(projectPath, components);
  }

  private async installDependencies(projectPath: string): Promise<void> {
    const additionalDeps = [
      "@types/react",
      "@types/react-dom",
      "clsx",
      "class-variance-authority",
    ];

    await execAsync(`npm install ${additionalDeps.join(" ")}`, {
      cwd: projectPath,
    });
  }

  private async setupProjectStructure(
    projectPath: string,
    config: Omit<ProjectConfig, "port" | "status">,
    port: number
  ): Promise<void> {
    // Create components directory in app folder (React Router structure)
    await fs.mkdir(path.join(projectPath, "app", "components"), {
      recursive: true,
    });

    // Create .rune directory for cache and metadata
    await fs.mkdir(path.join(projectPath, ".rune", "cache"), {
      recursive: true,
    });

    // Create comprehensive rune.json configuration
    const runeConfig: RuneConfig = {
      name: config.name,
      version: "1.0.0",
      description: config.description || "A visual app built with Rune",
      platform: "react",
      rune: {
        version: "0.1.0",
        studio: {
          graphFile: "./app/app.graph.json",
          componentsDir: "./app/components",
          outputDir: "./app/generated",
        },
        figma: config.figmaUrl
          ? {
              fileKey: this.extractFigmaFileKey(config.figmaUrl),
              nodeIds: [], // Will be populated during import
              lastSync: new Date().toISOString(),
            }
          : undefined,
        platform: {
          react: {
            framework: "react-router",
            uiLibrary: "tailwind",
            outputFormat: "tsx",
          },
        },
        // Internal project metadata
        project: {
          id: config.id,
          port: port,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          components: config.components.map((comp) => ({
            id: comp.name,
            name: comp.name,
            type: "figma" as const,
            figmaNodeId: comp.id,
            graphNodes: [],
            metadata: comp.properties || {},
          })),
        },
      },
      dependencies: {
        react: "^19.0.0",
        "react-dom": "^19.0.0",
        "@rune/runtime-react": "^0.1.0",
      },
    };

    await fs.writeFile(
      path.join(projectPath, "rune.json"),
      JSON.stringify(runeConfig, null, 2)
    );

    // Create initial graph file in app directory
    const initialGraph = {
      nodes: [],
      variables: [],
      customEvents: [],
    };

    await fs.writeFile(
      path.join(projectPath, "app", "app.graph.json"),
      JSON.stringify(initialGraph, null, 2)
    );

    // Create figma sync metadata
    if (config.figmaUrl) {
      const figmaSyncData = {
        fileKey: this.extractFigmaFileKey(config.figmaUrl),
        lastSync: new Date().toISOString(),
        syncedComponents: [],
        syncHistory: [],
      };

      await fs.writeFile(
        path.join(projectPath, ".rune", "figma-sync.json"),
        JSON.stringify(figmaSyncData, null, 2)
      );
    }

    // Update package.json with project info
    const packageJsonPath = path.join(projectPath, "package.json");
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));

    packageJson.name = config.id;
    packageJson.description =
      config.description || "Generated from Figma design";
    packageJson.version = "1.0.0";

    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  private extractFigmaFileKey(figmaUrl: string): string {
    // Extract file key from Figma URL
    const match = figmaUrl.match(/\/file\/([a-zA-Z0-9]+)/);
    return match ? match[1] : "";
  }

  private async updateHomeRoute(
    projectPath: string,
    components: ComponentData[]
  ): Promise<void> {
    const homeRouteContent = `import type { Route } from "./+types/home";
${components.map((c) => `import { ${c.name} } from "../components/${c.name}";`).join("\n")}
import { useEffect, useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "${components.length > 0 ? components[0].name : "Preview"}" },
    { name: "description", content: "Component preview" },
  ];
}

export default function Home() {
  const [componentProps, setComponentProps] = useState<Record<string, any>>({
    ${components.map((comp) => `${comp.name}: {}`).join(",\n    ")}
  });

  // Listen for graph updates from studio
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes('localhost')) return;
      
      if (event.data.type === 'GRAPH_UPDATE') {
        const graph = event.data.graph;
        processGraphNodes(graph);
      }
    };

    const processGraphNodes = (graph: any) => {
      if (!graph?.nodes) return;

      const newProps = { ...componentProps };

      graph.nodes.forEach((node: any) => {
        if (node.type === 'project/setProperty') {
          const componentId = node.parameters?.componentId?.value;
          const property = node.parameters?.property?.value;
          const value = node.parameters?.value?.value;

          if (componentId && property && value !== undefined) {
            if (!newProps[componentId]) {
              newProps[componentId] = {};
            }
            newProps[componentId][property] = value;
          }
        }
      });

      setComponentProps(newProps);
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [componentProps]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      ${
        components.length > 0
          ? `
      <div className="space-y-8">
        ${components
          .map(
            (component) => `
        <div className="flex flex-col items-center space-y-4">
          <${component.name} 
            {...componentProps.${component.name}}
            ${Object.entries(component.properties)
              .filter(([key]) => !["width", "height"].includes(key))
              .map(([key, value]) => {
                if (typeof value === "string") {
                  return `${key}="${value}"`;
                }
                return `${key}={${JSON.stringify(value)}}`;
              })
              .join("\n            ")}
          />
        </div>`
          )
          .join("\n        ")}
      </div>`
          : `
      <div className="text-center text-gray-500">
        <p>No components to preview</p>
      </div>`
      }
    </div>
  );
}`;

    await fs.writeFile(
      path.join(projectPath, "app", "routes", "home.tsx"),
      homeRouteContent
    );
  }

  /**
   * Checks if a port is available by attempting to bind to it
   */
  private async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();

      server.listen(port, () => {
        server.once("close", () => {
          resolve(true);
        });
        server.close();
      });

      server.on("error", () => {
        resolve(false);
      });
    });
  }

  /**
   * Finds an available port starting from basePort
   * Uses actual network binding to ensure port is truly available
   */
  private async findAvailablePort(): Promise<number> {
    let port = this.basePort;
    const maxAttempts = 100; // Prevent infinite loops
    let attempts = 0;

    while (attempts < maxAttempts) {
      const isAvailable = await this.isPortAvailable(port);
      if (isAvailable) {
        return port;
      }
      port++;
      attempts++;
    }

    throw new Error(
      `Could not find an available port after ${maxAttempts} attempts starting from ${this.basePort}`
    );
  }

  /**
   * Updates the port in an existing project's rune.json
   */
  private async updateProjectPort(
    projectPath: string,
    port: number
  ): Promise<void> {
    try {
      const configPath = path.join(projectPath, "rune.json");
      const runeConfig = JSON.parse(await fs.readFile(configPath, "utf-8"));

      if (runeConfig.rune?.project) {
        runeConfig.rune.project.port = port;
        runeConfig.rune.project.updatedAt = new Date().toISOString();

        await fs.writeFile(configPath, JSON.stringify(runeConfig, null, 2));
      }
    } catch (error) {
      console.warn("Could not update project port:", error);
    }
  }

  async listProjects(): Promise<ProjectConfig[]> {
    try {
      const projects = await fs.readdir(this.projectsDir);
      const configs: ProjectConfig[] = [];

      for (const projectDir of projects) {
        try {
          const configPath = path.join(
            this.projectsDir,
            projectDir,
            "rune.json"
          );
          const runeConfig = JSON.parse(await fs.readFile(configPath, "utf-8"));

          // Check if dev server is running
          const pidFile = path.join(
            this.projectsDir,
            projectDir,
            ".dev-server.pid"
          );
          let status: ProjectConfig["status"] = "ready";

          try {
            const pidData = await fs.readFile(pidFile, "utf-8");
            if (pidData) {
              let pid: number;
              try {
                // Try parsing as JSON first (new format)
                const parsed = JSON.parse(pidData);
                pid = parsed.pid;
              } catch {
                // Fallback to old format (plain string)
                pid = parseInt(pidData);
              }

              if (pid && !isNaN(pid)) {
                // Check if process is still running
                try {
                  process.kill(pid, 0);
                  status = "running";
                } catch {
                  status = "ready";
                  // Clean up stale PID file
                  await fs.unlink(pidFile);
                }
              }
            }
          } catch {
            // No PID file
          }

          // Map rune.json structure to ProjectConfig interface
          const projectConfig: ProjectConfig = {
            id: runeConfig.rune?.project?.id || projectDir,
            name: runeConfig.name,
            description: runeConfig.description,
            figmaUrl: runeConfig.rune?.figma?.fileKey
              ? `https://www.figma.com/file/${runeConfig.rune.figma.fileKey}/`
              : undefined,
            port: runeConfig.rune?.project?.port || 3001,
            status,
            components: runeConfig.rune?.project?.components || [],
          };

          configs.push(projectConfig);
        } catch (error) {
          console.warn(
            `Could not load project config for ${projectDir}:`,
            error
          );
        }
      }

      return configs;
    } catch {
      return [];
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    const projectPath = path.join(this.projectsDir, projectId);

    // Stop dev server if running
    await this.stopDevServer(projectId);

    // Remove project directory
    await fs.rm(projectPath, { recursive: true, force: true });
  }
}
