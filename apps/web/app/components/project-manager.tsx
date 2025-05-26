import React, { useState, useEffect } from "react";
import {
  createFigmaImporter,
  type FigmaImportOptions,
} from "../lib/figma/figma-importer";
import type { ProjectConfig } from "../lib/project/project-generator";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";

interface ProjectManagerProps {
  onProjectCreated?: (project: ProjectConfig) => void;
}

export function ProjectManager({ onProjectCreated }: ProjectManagerProps) {
  const [projects, setProjects] = useState<ProjectConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    figmaUrl: "",
    projectName: "",
    projectDescription: "",
    startDevServer: true,
  });

  const importer = createFigmaImporter();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    if (!importer) return;

    try {
      const projectList = await importer.listProjects();
      setProjects(projectList);
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importer) {
      setError("Figma token not configured");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const options: FigmaImportOptions = {
        createProject: true,
        projectName: formData.projectName || "Figma Import",
        projectDescription: formData.projectDescription,
        startDevServer: formData.startDevServer,
      };

      const result = await importer.importFromUrl(formData.figmaUrl, options);

      if (result.success && result.project) {
        setProjects((prev) => [...prev, result.project!]);
        setShowCreateForm(false);
        setFormData({
          figmaUrl: "",
          projectName: "",
          projectDescription: "",
          startDevServer: true,
        });
        onProjectCreated?.(result.project);
      } else {
        setError(result.error || "Failed to create project");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleStartProject = async (projectId: string) => {
    if (!importer) return;

    try {
      await importer.startProject(projectId);
      await loadProjects(); // Refresh to update status
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start project");
    }
  };

  const handleStopProject = async (projectId: string) => {
    if (!importer) return;

    try {
      await importer.stopProject(projectId);
      await loadProjects(); // Refresh to update status
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop project");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!importer) return;
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await importer.deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
    }
  };

  const getStatusVariant = (status: ProjectConfig["status"]) => {
    switch (status) {
      case "running":
        return "default";
      case "ready":
        return "secondary";
      case "creating":
        return "outline";
      case "error":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (!importer) {
    return (
      <Alert>
        <AlertDescription>
          Please configure your Figma API token in the settings to use the
          project manager.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-semibold">Projects</h2>
          <p className="text-sm text-muted-foreground">
            Manage your Figma imports and React projects
          </p>
        </div>
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button size="sm">Create New Project</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">
                Create New Project
              </DialogTitle>
              <DialogDescription className="text-sm">
                Import a Figma design and generate a React project
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="figmaUrl" className="text-sm">
                  Figma URL
                </Label>
                <Input
                  id="figmaUrl"
                  type="url"
                  required
                  value={formData.figmaUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      figmaUrl: e.target.value,
                    }))
                  }
                  placeholder="https://www.figma.com/file/..."
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectName" className="text-sm">
                  Project Name
                </Label>
                <Input
                  id="projectName"
                  type="text"
                  value={formData.projectName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      projectName: e.target.value,
                    }))
                  }
                  placeholder="My Figma Project"
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.projectDescription}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      projectDescription: e.target.value,
                    }))
                  }
                  placeholder="Optional description..."
                  rows={3}
                  className="text-sm"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="startDevServer"
                  checked={formData.startDevServer}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      startDevServer: checked === true,
                    }))
                  }
                />
                <Label htmlFor="startDevServer" className="text-sm">
                  Start dev server automatically
                </Label>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  size="sm"
                  className="flex-1"
                >
                  {loading ? "Creating..." : "Create Project"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">
            {error}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="ml-2 h-auto p-0 text-xs underline"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <svg
                  className="h-6 w-6 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-base font-semibold">No projects yet</h3>
              <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
                Get started by creating your first project from a Figma design.
                We'll generate a React codebase for you.
              </p>
              <Button
                size="sm"
                className="mt-4"
                onClick={() => setShowCreateForm(true)}
              >
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{project.name}</CardTitle>
                    {project.description && (
                      <CardDescription className="text-sm">
                        {project.description}
                      </CardDescription>
                    )}
                    {project.figmaUrl && (
                      <a
                        href={project.figmaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        View in Figma
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    )}
                  </div>
                  <Badge
                    variant={getStatusVariant(project.status)}
                    className="text-xs"
                  >
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Port: {project.port} • Components:{" "}
                    {project.components.length}
                  </div>

                  <div className="flex items-center gap-2">
                    {project.status === "running" ? (
                      <>
                        <Button size="sm" asChild>
                          <a
                            href={`http://localhost:${project.port}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStopProject(project.id)}
                        >
                          Stop
                        </Button>
                      </>
                    ) : project.status === "ready" ? (
                      <Button
                        size="sm"
                        onClick={() => handleStartProject(project.id)}
                      >
                        Start
                      </Button>
                    ) : null}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
