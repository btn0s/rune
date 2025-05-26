import express from "express";
import { ProjectGenerator } from "./app/lib/project/project-generator";

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

// Start the API server
const port = process.env.API_PORT || 3001;
app.listen(port, () => {
  console.log(
    `Project Generation API Server running on http://localhost:${port}`
  );
  console.log(`API endpoints available at http://localhost:${port}/api`);
});
