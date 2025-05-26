import express from "express";
import { ProjectGenerator } from "./app/lib/project/project-generator";
import * as fs from "fs/promises";
import * as path from "path";

const app = express();

// Parse JSON bodies
app.use(express.json());

// CORS middleware for development
app.use((req: any, res: any, next: any) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Create project generator instance
const projectGenerator = new ProjectGenerator();

// API routes for project management
app.post("/api/projects", async (req: any, res: any) => {
  try {
    const { name, description, figmaUrl, components } = req.body;

    const projectId = generateProjectId(name);
    const project = await projectGenerator.createProject({
      id: projectId,
      name,
      description,
      figmaUrl,
      components: components || [],
    });

    res.json({ success: true, project });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/api/projects", async (req: any, res: any) => {
  try {
    const projects = await projectGenerator.listProjects();
    res.json({ success: true, projects });
  } catch (error) {
    console.error("Error listing projects:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get project's rune.json configuration
app.get("/api/projects/:id/config", async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const projectPath = path.join("generated-projects", id, "rune.json");

    try {
      const configContent = await fs.readFile(projectPath, "utf-8");
      const config = JSON.parse(configContent);
      res.json({ success: true, config });
    } catch (fileError) {
      // If rune.json doesn't exist, return a default config
      const projects = await projectGenerator.listProjects();
      const project = projects.find((p) => p.id === id);

      if (!project) {
        return res
          .status(404)
          .json({ success: false, error: "Project not found" });
      }

      // Create default config based on project
      const defaultConfig = {
        name: project.name,
        version: "1.0.0",
        description: project.description,
        rune: {
          version: "0.1.0",
          studio: {
            graphFile: "./app/app.graph.json",
            componentsDir: "./app/components",
            outputDir: "./app/generated",
          },
          figma: project.figmaUrl
            ? {
                fileKey: extractFigmaFileKey(project.figmaUrl),
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

      res.json({ success: true, config: defaultConfig });
    }
  } catch (error) {
    console.error("Error getting project config:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Update project's rune.json configuration
app.put("/api/projects/:id/config", async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { config } = req.body;
    const projectPath = path.join("generated-projects", id, "rune.json");

    await fs.writeFile(projectPath, JSON.stringify(config, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating project config:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get project's graph
app.get("/api/projects/:id/graph", async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const graphPath = path.join(
      "generated-projects",
      id,
      "app",
      "app.graph.json"
    );

    try {
      const graphContent = await fs.readFile(graphPath, "utf-8");
      const graph = JSON.parse(graphContent);
      res.json({ success: true, graph });
    } catch (fileError) {
      // If graph doesn't exist, return empty graph
      const emptyGraph = {
        nodes: [],
        variables: [],
        customEvents: [],
      };
      res.json({ success: true, graph: emptyGraph });
    }
  } catch (error) {
    console.error("Error getting project graph:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Update project's graph
app.post("/api/projects/:id/graph", async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { graph } = req.body;
    const projectPath = path.join("generated-projects", id);
    const graphPath = path.join(projectPath, "app", "app.graph.json");

    // Ensure app directory exists
    await fs.mkdir(path.join(projectPath, "app"), { recursive: true });

    await fs.writeFile(graphPath, JSON.stringify(graph, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating project graph:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.post("/api/projects/:id/start", async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const projects = await projectGenerator.listProjects();
    const project = projects.find((p) => p.id === id);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, error: "Project not found" });
    }

    await projectGenerator.startDevServer(id, project.port);
    res.json({ success: true });
  } catch (error) {
    console.error("Error starting project:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.post("/api/projects/:id/stop", async (req: any, res: any) => {
  try {
    const { id } = req.params;
    await projectGenerator.stopDevServer(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error stopping project:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.delete("/api/projects/:id", async (req: any, res: any) => {
  try {
    const { id } = req.params;
    await projectGenerator.deleteProject(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.put("/api/projects/:id/components", async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { components } = req.body;

    const projects = await projectGenerator.listProjects();
    const project = projects.find((p) => p.id === id);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, error: "Project not found" });
    }

    const projectPath = `generated-projects/${id}`;
    await projectGenerator.writeComponents(projectPath, components);

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating project components:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Health check endpoint
app.get("/api/health", (req: any, res: any) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

function generateProjectId(baseName: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const cleanName = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${cleanName}-${timestamp}-${randomSuffix}`;
}

function extractFigmaFileKey(figmaUrl: string): string {
  const match = figmaUrl.match(/\/file\/([a-zA-Z0-9]+)/);
  return match ? match[1] : "";
}

// Start the API server
const port = process.env.API_PORT || 3001;
app.listen(port, () => {
  console.log(
    `Project Generation API Server running on http://localhost:${port}`
  );
  console.log(`API endpoints available at http://localhost:${port}/api`);
});
