import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { Flow, type FlowRef } from "~/components/flow/Flow";
import { ComponentPreview } from "~/components/flow/ComponentPreview";
import { getProjectStorage } from "~/lib/storage/project-storage";
import type { RuneProject } from "~/lib/types/project";
import { createProjectRegistry } from "~/lib/registry/project-registry";
import { ProjectManagerImpl } from "~/lib/project/project-manager";
import { createFigmaImporter } from "~/lib/figma/figma-importer";
import { projectApi } from "~/lib/project/project-api";
import type { GraphJSON } from "@rune/behave-graph-core";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "~/components/ui/resizable";
import { Button } from "~/components/ui/button";

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
  const [devServerStarting, setDevServerStarting] = useState(false);
  const [devServerStatus, setDevServerStatus] = useState<
    "stopped" | "starting" | "running" | "error"
  >("stopped");
  const [projectPort, setProjectPort] = useState<number>(3001);

  // Ref to prevent infinite loops when updating graph
  const isUpdatingGraph = useRef(false);
  // Ref to the preview iframe for message passing
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  // Ref to the Flow component for accessing togglePlay
  const flowRef = useRef<FlowRef>(null);
  // State to track playing status for UI updates
  const [playing, setPlaying] = useState(false);

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

      // Use the Storage System (which now facades over the Generator System)
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

      // Check current dev server status
      await checkDevServerStatus(id);

      // Auto-start the dev server if it's not already running
      const projects = await projectApi.listProjects();
      const currentProject = projects.find((p) => p.id === id);

      if (currentProject && currentProject.status !== "running") {
        await startDevServer(id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const startDevServer = async (projectId: string) => {
    try {
      setDevServerStarting(true);
      setDevServerStatus("starting");

      const port = await projectApi.startProject(projectId);
      setProjectPort(port);

      setDevServerStatus("running");
      console.log(
        `Dev server started for project ${projectId} on port ${port}`
      );
    } catch (err) {
      console.error("Failed to start dev server:", err);
      setDevServerStatus("error");
      // Don't show error to user as this is auto-start, they can manually start if needed
    } finally {
      setDevServerStarting(false);
    }
  };

  const checkDevServerStatus = async (projectId: string) => {
    try {
      // Get project list to check current status
      const projects = await projectApi.listProjects();
      const currentProject = projects.find((p) => p.id === projectId);

      if (currentProject) {
        setProjectPort(currentProject.port);
        if (currentProject.status === "running") {
          setDevServerStatus("running");
        } else {
          setDevServerStatus("stopped");
        }
      }
    } catch (err) {
      console.error("Failed to check dev server status:", err);
      setDevServerStatus("stopped");
    }
  };

  const stopDevServer = async (projectId: string) => {
    try {
      await projectApi.stopProject(projectId);
      setDevServerStatus("stopped");
      console.log(`Dev server stopped for project ${projectId}`);
    } catch (err) {
      console.error("Failed to stop dev server:", err);
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

    // Send graph update to preview iframe if it's loaded
    if (previewIframeRef.current && devServerStatus === "running") {
      try {
        previewIframeRef.current.contentWindow?.postMessage(
          {
            type: "GRAPH_UPDATE",
            graph: newGraph,
          },
          `http://localhost:${projectPort}`
        );
      } catch (error) {
        console.warn("Failed to send graph update to preview:", error);
      }
    }

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

  // Create project-aware registry with the actual project configuration
  const figmaImporter = createFigmaImporter();
  const registry = createProjectRegistry(
    project.config,
    projectManager,
    figmaImporter || undefined
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
              value: project.config.rune.figma?.fileKey
                ? `https://www.figma.com/file/${project.config.rune.figma.fileKey}/`
                : "https://www.figma.com/file/example123/Sample-Design",
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
      <div className="z-10 bg-background/95 backdrop-blur-sm border-b border-border">
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
            {/* Run Button */}
            <Button
              size="sm"
              onClick={() => {
                // Call the Flow component's togglePlay function
                flowRef.current?.togglePlay();
                // Update local playing state
                const newPlayingState = !playing;
                setPlaying(newPlayingState);

                // Automatically open preview when starting to run
                if (newPlayingState && !showPreview) {
                  setShowPreview(true);
                }

                // Close preview when pausing
                if (!newPlayingState && showPreview) {
                  setShowPreview(false);
                }
              }}
              className={`text-xs text-foreground ${
                playing
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {playing ? "Pause" : "Run"}
            </Button>
            <Button
              size={"sm"}
              onClick={handleSaveProject}
              disabled={saving}
              className="text-xs"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full h-full flex">
        {showPreview ? (
          <ResizablePanelGroup direction="horizontal" className="w-full h-full">
            {/* Flow Editor */}
            <ResizablePanel defaultSize={70} minSize={30}>
              <Flow
                ref={flowRef}
                initialGraph={project.graph}
                registry={registry}
                examples={examples}
                onGraphChange={handleGraphChange}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Preview Panel */}
            <ResizablePanel defaultSize={30} minSize={20}>
              <div className="h-full bg-background overflow-hidden pt-2 px-3 pb-3">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium">Live Preview</h3>
                    <div className="flex items-center gap-2">
                      {devServerStatus === "running" && (
                        <a
                          href={`http://localhost:${projectPort}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Open in new tab ↗
                        </a>
                      )}
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            devServerStatus === "running"
                              ? "bg-green-500"
                              : devServerStatus === "starting"
                                ? "bg-yellow-500 animate-pulse"
                                : devServerStatus === "error"
                                  ? "bg-red-500"
                                  : "bg-gray-400"
                          }`}
                        ></div>
                        <span className="text-xs text-muted-foreground">
                          {devServerStatus === "running"
                            ? "Live"
                            : devServerStatus === "starting"
                              ? "Starting..."
                              : devServerStatus === "error"
                                ? "Error"
                                : "Stopped"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 border border-border rounded-md overflow-hidden bg-white">
                    {devServerStatus === "running" ? (
                      <iframe
                        ref={previewIframeRef}
                        src={`http://localhost:${projectPort}`}
                        className="w-full h-full border-0"
                        title="Live Preview"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                        onLoad={() => {
                          // Send initial graph state when iframe loads
                          if (previewIframeRef.current && project?.graph) {
                            setTimeout(() => {
                              try {
                                previewIframeRef.current?.contentWindow?.postMessage(
                                  {
                                    type: "GRAPH_UPDATE",
                                    graph: project.graph,
                                  },
                                  `http://localhost:${projectPort}`
                                );
                              } catch (error) {
                                console.warn(
                                  "Failed to send initial graph to preview:",
                                  error
                                );
                              }
                            }, 1000); // Wait a bit for the iframe to fully load
                          }
                        }}
                      />
                    ) : devServerStatus === "starting" ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                          <p className="text-sm text-muted-foreground">
                            Starting dev server...
                          </p>
                        </div>
                      </div>
                    ) : devServerStatus === "error" ? (
                      <div className="w-full h-full flex items-center justify-center bg-red-50">
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto mb-4 text-red-500">
                            <svg
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
                          <p className="text-sm text-red-600 mb-2">
                            Server Error
                          </p>
                          <button
                            onClick={() => startDevServer(project?.id || "")}
                            className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                          >
                            Retry
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
                            <svg
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z"
                              />
                            </svg>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Dev server stopped
                          </p>
                          <button
                            onClick={() => startDevServer(project?.id || "")}
                            disabled={devServerStarting}
                            className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                          >
                            {devServerStarting ? "Starting..." : "Start Server"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          /* Flow Editor - Full Width when preview is hidden */
          <div className="w-full h-full">
            <Flow
              ref={flowRef}
              initialGraph={project.graph}
              registry={registry}
              examples={examples}
              onGraphChange={handleGraphChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
