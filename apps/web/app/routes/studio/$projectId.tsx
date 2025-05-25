import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { Flow } from "~/components/flow/Flow";
import { ComponentPreview } from "~/components/flow/ComponentPreview";
import { getProjectStorage } from "~/lib/storage/project-storage";
import type { RuneProject } from "~/lib/types/project";
import { createProjectRegistry } from "~/lib/registry/project-registry";
import { ProjectManagerImpl } from "~/lib/project/project-manager";
import type { GraphJSON } from "@rune/behave-graph-core";

export function meta() {
  return [
    { title: "Project Studio - Rune" },
    { name: "description", content: "Edit your Rune project" },
  ];
}

export default function ProjectStudio() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<RuneProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [projectManager, setProjectManager] =
    useState<ProjectManagerImpl | null>(null);
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
      const storage = await getProjectStorage();
      const loadedProject = await storage.getProject(id);

      if (!loadedProject) {
        setError("Project not found");
        return;
      }

      setProject(loadedProject);

      // Create project manager with the loaded project
      const manager = new ProjectManagerImpl(loadedProject);
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

    const updatedProject = {
      ...project,
      graph: newGraph,
      updatedAt: new Date().toISOString(),
    };

    setProject(updatedProject);

    // Update project manager's current project
    projectManager.setCurrentProject(updatedProject);

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

  if (error || !project || !projectManager) {
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

  // Create project-aware registry with platform capabilities
  const registry = createProjectRegistry(
    project.config,
    projectManager
    // TODO: Add Figma importer when available
  );

  // Create examples object with project-specific examples
  const examples = {
    "Current Project": project.graph,
    "Figma Import Demo": {
      nodes: [
        {
          id: "figma-import",
          type: "figma/import",
          parameters: {
            figmaUrl: {
              value: "https://www.figma.com/file/example123/Sample-Design",
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
                {project.platform} • {project.components.length} components
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground px-2 py-1 bg-accent rounded">
              Project Mode
            </div>
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
              to={`/studio/${project.id}/settings`}
              className="px-3 py-1.5 text-xs border border-border rounded-md hover:bg-accent transition-colors"
            >
              Settings
            </Link>
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
            initialGraph={project.graph}
            registry={registry}
            examples={examples}
            onGraphChange={handleGraphChange}
          />
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="w-1/3 h-full border-l border-border bg-background overflow-auto p-2">
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
