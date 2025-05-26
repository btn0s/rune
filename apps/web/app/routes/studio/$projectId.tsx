import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { Flow } from "~/components/flow/Flow";
import { ComponentPreview } from "~/components/flow/ComponentPreview";
import { createFigmaImporter } from "~/lib/figma/figma-importer";
import type { ProjectConfig } from "~/lib/project/project-generator";
import type { RuneConfig } from "~/lib/types/project";
import { createProjectRegistry } from "~/lib/registry/project-registry";
import type { GraphJSON } from "@rune/behave-graph-core";

export function meta() {
  return [
    { title: "Project Studio - Rune" },
    { name: "description", content: "Edit your Rune project" },
  ];
}

// Simple project manager for the new system
class NewProjectManager {
  private currentProject: ProjectConfig | null = null;

  getCurrentProject(): ProjectConfig | null {
    return this.currentProject;
  }

  setCurrentProject(project: ProjectConfig): void {
    this.currentProject = project;
  }

  async saveProject(project: ProjectConfig): Promise<void> {
    // For now, just update the current project
    // In the future, this could save to the project's rune.json file
    this.currentProject = project;
    console.log("Project saved:", project);
  }

  async loadProject(id: string): Promise<ProjectConfig | null> {
    // This would be implemented by calling the server API
    // For now, return null as we'll load via the importer
    return null;
  }

  async updateProjectGraph(projectId: string, graph: any): Promise<void> {
    // TODO: Save graph to the project's app.graph.json file via API
    console.log("Updating project graph:", projectId, graph);
  }
}

export default function ProjectStudio() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectConfig | null>(null);
  const [projectConfig, setProjectConfig] = useState<RuneConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [projectManager, setProjectManager] =
    useState<NewProjectManager | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState(
    '<div class="p-4 text-gray-500">No components generated yet</div>'
  );

  // Ref to prevent infinite loops when updating graph
  const isUpdatingGraph = useRef(false);

  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId]);

  // Listen for preview generation events
  useEffect(() => {
    const handlePreviewGenerated = (event: CustomEvent) => {
      console.log("Received preview-generated event:", event.detail);
      const { previewHtml } = event.detail;
      if (
        previewHtml &&
        typeof previewHtml === "string" &&
        previewHtml.trim()
      ) {
        console.log("Setting preview HTML from event and showing preview");
        setPreviewHtml(previewHtml);
        setShowPreview(true);
      }
    };

    window.addEventListener(
      "rune:preview-generated",
      handlePreviewGenerated as EventListener
    );

    return () => {
      window.removeEventListener(
        "rune:preview-generated",
        handlePreviewGenerated as EventListener
      );
    };
  }, []);

  const loadProject = async (id: string) => {
    try {
      setLoading(true);

      // Use the Figma importer to load projects (same as project-manager.tsx)
      const importer = createFigmaImporter();
      if (!importer) {
        setError("Figma token not configured");
        return;
      }

      const projects = await importer.listProjects();
      const loadedProject = projects.find((p) => p.id === id);

      if (!loadedProject) {
        setError("Project not found");
        return;
      }

      setProject(loadedProject);

      // Load the project's rune.json configuration
      try {
        const configResponse = await fetch(`/api/projects/${id}/config`);
        if (configResponse.ok) {
          const config = await configResponse.json();
          setProjectConfig(config);
        } else {
          // Fallback to a default config if rune.json doesn't exist
          const defaultConfig: RuneConfig = {
            name: loadedProject.name,
            version: "1.0.0",
            description: loadedProject.description,
            rune: {
              version: "0.1.0",
              studio: {
                graphFile: "./app/app.graph.json",
                componentsDir: "./app/components",
                outputDir: "./app/generated",
              },
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
          setProjectConfig(defaultConfig);
        }
      } catch (configError) {
        console.warn(
          "Failed to load project config, using default:",
          configError
        );
        // Use default config
        const defaultConfig: RuneConfig = {
          name: loadedProject.name,
          version: "1.0.0",
          description: loadedProject.description,
          rune: {
            version: "0.1.0",
            studio: {
              graphFile: "./app/app.graph.json",
              componentsDir: "./app/components",
              outputDir: "./app/generated",
            },
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
        setProjectConfig(defaultConfig);
      }

      // Create project manager with the loaded project
      const manager = new NewProjectManager();
      manager.setCurrentProject(loadedProject);
      setProjectManager(manager);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async () => {
    if (!project || !projectManager) return;

    try {
      setSaving(true);
      await projectManager.saveProject(project);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  const handleGraphChange = (newGraph: any) => {
    if (!project || !projectManager || isUpdatingGraph.current) return;

    // Set flag to prevent infinite loop
    isUpdatingGraph.current = true;

    // Update project manager's current project
    projectManager.updateProjectGraph(project.id, newGraph);

    // Check if any nodes generated preview HTML
    if (newGraph.nodes) {
      console.log("Checking nodes for preview HTML...");
      for (const node of newGraph.nodes) {
        console.log(`Node ${node.id} (${node.type}):`, {
          outputs: node.outputs,
          parameters: node.parameters,
        });

        if (node.type === "project/generateComponents") {
          // Check multiple possible locations for the preview HTML
          const previewHtml =
            node.outputs?.previewHtml?.value ||
            node.outputs?.previewHtml ||
            node.parameters?.previewHtml?.value ||
            node.parameters?.previewHtml;

          console.log(
            "Found GenerateComponents node, previewHtml:",
            previewHtml
          );

          if (
            previewHtml &&
            typeof previewHtml === "string" &&
            previewHtml.trim()
          ) {
            console.log("Setting preview HTML and showing preview");
            setPreviewHtml(previewHtml);
            setShowPreview(true);
            break;
          }
        }
      }
    }

    // Reset flag after state update
    setTimeout(() => {
      isUpdatingGraph.current = false;
    }, 0);
  };

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project || !projectManager || !projectConfig) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg
              className="w-12 h-12 mx-auto text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">
            {error || "Project not found"}
          </h3>
          <p className="text-muted-foreground mb-4">
            The project you're looking for doesn't exist or couldn't be loaded.
          </p>
          <Link
            to="/studio"
            className="inline-flex px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  // Create project-aware registry with the actual project configuration
  const registry = createProjectRegistry(
    projectConfig,
    projectManager,
    createFigmaImporter()
  );

  // Create examples object with project-specific examples
  const examples = {
    "Figma Import Demo": {
      nodes: [
        {
          id: "figma-import",
          type: "figma/import",
          parameters: {
            figmaUrl: {
              value:
                project.figmaUrl ||
                "https://www.figma.com/file/example123/Sample-Design",
            },
            figmaToken: {
              value: "",
            },
          },
          flows: {
            flow: { nodeId: "generate-components", socket: "flow" },
          },
          metadata: {
            positionX: "100",
            positionY: "100",
          },
        },
        {
          id: "generate-components",
          type: "project/generateComponents",
          parameters: {
            components: {
              link: { nodeId: "figma-import", socket: "components" },
            },
          },
          metadata: {
            positionX: "400",
            positionY: "100",
          },
        },
        {
          id: "start",
          type: "lifecycle/onStart",
          flows: {
            flow: { nodeId: "figma-import", socket: "flow" },
          },
          metadata: {
            positionX: "100",
            positionY: "300",
          },
        },
      ],
      variables: [],
      customEvents: [],
    } as GraphJSON,
  };

  return (
    <div className="h-screen w-screen relative bg-background">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link to="/studio" className="flex items-center gap-2">
              <img
                src="/logo.svg"
                className="size-6 border border-foreground/20 rounded-md overflow-hidden"
                alt="Rune"
              />
              <span className="font-bold text-sm">rune</span>
            </Link>
            <div className="text-sm text-muted-foreground">/</div>
            <div>
              <h1 className="font-medium text-sm">{project.name}</h1>
              <p className="text-xs text-muted-foreground">
                {project.components.length} components
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                showPreview
                  ? "bg-primary text-primary-foreground"
                  : "border border-border hover:bg-accent"
              }`}
            >
              {showPreview ? "Hide Preview" : "Show Preview"}
            </button>
            <button
              onClick={handleSaveProject}
              disabled={saving}
              className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <Link
              to="/studio"
              className="px-3 py-1.5 text-xs border border-border rounded-md hover:bg-accent transition-colors"
            >
              Close
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full h-full pt-16 flex">
        {/* Flow Editor */}
        <div
          className={`${showPreview ? "w-2/3" : "w-full"} h-full transition-all duration-300`}
        >
          <Flow
            initialGraph={{ nodes: [], variables: [], customEvents: [] }}
            registry={registry}
            examples={examples}
            onGraphChange={handleGraphChange}
          />
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="w-1/3 h-full border-l border-border bg-background overflow-auto pt-2 px-3 pb-3">
            <ComponentPreview
              previewHtml={previewHtml}
              title="Component Preview"
            />
          </div>
        )}
      </div>
    </div>
  );
}
