import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { createFigmaImporter } from "~/lib/figma/figma-importer";
import type { ProjectConfig } from "~/lib/project/project-generator";

export function meta() {
  return [
    { title: "Project Details - Rune Studio" },
    {
      name: "description",
      content: "View project details and manage components",
    },
  ];
}

export default function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const importer = createFigmaImporter();
      if (!importer) {
        setError("Failed to initialize Figma importer");
        return;
      }

      const projects = await importer.listProjects();
      const foundProject = projects.find((p) => p.id === projectId);

      if (!foundProject) {
        setError("Project not found");
        return;
      }

      setProject(foundProject);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const handleStartProject = async () => {
    if (!project) return;

    try {
      const importer = createFigmaImporter();
      if (!importer) return;

      await importer.startProject(project.id);
      setProject((prev) => (prev ? { ...prev, status: "running" } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start project");
    }
  };

  const handleStopProject = async () => {
    if (!project) return;

    try {
      const importer = createFigmaImporter();
      if (!importer) return;

      await importer.stopProject(project.id);
      setProject((prev) => (prev ? { ...prev, status: "ready" } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop project");
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const importer = createFigmaImporter();
      if (!importer) return;

      await importer.deleteProject(project.id);
      navigate("/studio");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
    }
  };

  const getStatusColor = (status: ProjectConfig["status"]) => {
    switch (status) {
      case "running":
        return "text-green-600 bg-green-100";
      case "ready":
        return "text-blue-600 bg-blue-100";
      case "creating":
        return "text-yellow-600 bg-yellow-100";
      case "error":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container mx-auto px-6 py-4">
            <Link to="/studio" className="flex items-center gap-3">
              <img
                src="/logo.svg"
                className="size-8 border border-foreground/20 rounded-md overflow-hidden"
                alt="Rune"
              />
              <div>
                <h1 className="text-xl font-bold">Rune Studio</h1>
                <p className="text-sm text-muted-foreground">
                  Project Not Found
                </p>
              </div>
            </Link>
          </div>
        </header>
        <div className="container mx-auto px-6 py-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {error || "The requested project could not be found."}
            </p>
            <Link
              to="/studio"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Back to Projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/studio" className="flex items-center gap-3">
              <img
                src="/logo.svg"
                className="size-8 border border-foreground/20 rounded-md overflow-hidden"
                alt="Rune"
              />
              <div>
                <h1 className="text-xl font-bold">Rune Studio</h1>
                <p className="text-sm text-muted-foreground">{project.name}</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              {project.status === "running" && (
                <a
                  href={`http://localhost:${project.port}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  View Live
                </a>
              )}
              <Link
                to="/studio"
                className="px-3 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors"
              >
                Back to Projects
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-destructive text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-xs text-destructive hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Project Info */}
        <div className="bg-white border border-border rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {project.name}
              </h2>
              {project.description && (
                <p className="text-muted-foreground mb-4">
                  {project.description}
                </p>
              )}
              {project.figmaUrl && (
                <a
                  href={project.figmaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View in Figma →
                </a>
              )}
            </div>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(project.status)}`}
            >
              {project.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-sm">
              <span className="text-muted-foreground">Port:</span>
              <span className="ml-2 font-medium">{project.port}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Components:</span>
              <span className="ml-2 font-medium">
                {project.components.length}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span className="ml-2 font-medium capitalize">
                {project.status}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            {project.status === "ready" && (
              <button
                onClick={handleStartProject}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Start Dev Server
              </button>
            )}
            {project.status === "running" && (
              <button
                onClick={handleStopProject}
                className="px-4 py-2 border border-border text-foreground rounded-md hover:bg-accent transition-colors"
              >
                Stop Dev Server
              </button>
            )}
            <button
              onClick={handleDeleteProject}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors"
            >
              Delete Project
            </button>
          </div>
        </div>

        {/* Components List */}
        {project.components.length > 0 && (
          <div className="bg-white border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Components</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.components.map((component, index) => (
                <div
                  key={index}
                  className="p-4 border border-border rounded-lg"
                >
                  <h4 className="font-medium mb-2">{component.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Type: {component.type}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    Properties: {Object.keys(component.properties).length}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
