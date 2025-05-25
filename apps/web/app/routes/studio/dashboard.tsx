import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { getProjectStorage } from "~/lib/storage/project-storage";
import type { RuneProject, ProjectTemplate } from "~/lib/types/project";

export function meta() {
  return [
    { title: "Rune Studio - Projects" },
    { name: "description", content: "Manage your Rune projects" },
  ];
}

export default function StudioDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<RuneProject[]>([]);
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const storage = await getProjectStorage();
      const [projectList, templateList] = await Promise.all([
        storage.listProjects(),
        storage.listTemplates(),
      ]);
      setProjects(projectList);
      setTemplates(templateList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const storage = await getProjectStorage();
      await storage.deleteProject(projectId);
      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
    }
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    try {
      const storage = await getProjectStorage();
      const template = templates.find((t) => t.id === templateId);
      if (!template) return;

      const project = await storage.createProject({
        name: `${template.name} Copy`,
        description: template.description,
        platform: template.platform,
        template: templateId,
      });

      navigate(`/studio/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading projects...</p>
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
            <div className="flex items-center gap-3">
              <img
                src="/logo.svg"
                className="size-8 border border-foreground/20 rounded-md overflow-hidden"
                alt="Rune"
              />
              <div>
                <h1 className="text-xl font-bold">Rune Studio</h1>
                <p className="text-sm text-muted-foreground">
                  Visual Development Platform
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/behave-graph"
                className="px-3 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors"
              >
                View Demo
              </Link>
              <Link
                to="/studio/new"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                New Project
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

        {/* Quick Start Templates */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4">Quick Start</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-4 border border-border rounded-lg hover:border-foreground/40 transition-colors cursor-pointer"
                onClick={() => handleCreateFromTemplate(template.id)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {template.category}
                  </span>
                </div>
                <h3 className="font-medium mb-1">{template.name}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {template.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-1 bg-accent rounded">
                    {template.platform}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Click to create
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Projects */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Projects</h2>
            {projects.length > 0 && (
              <button
                onClick={loadData}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Refresh
              </button>
            )}
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg">
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first project to get started with visual development
              </p>
              <Link
                to="/studio/new"
                className="inline-flex px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Create Project
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="p-4 border border-border rounded-lg hover:border-foreground/40 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium mb-1">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      title="Delete project"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span className="px-2 py-1 bg-accent rounded">
                      {project.platform}
                    </span>
                    <span>
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/studio/${project.id}`}
                      className="flex-1 px-3 py-2 bg-primary text-primary-foreground text-sm text-center rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Open
                    </Link>
                    <Link
                      to={`/studio/${project.id}/settings`}
                      className="px-3 py-2 border border-border text-sm rounded-md hover:bg-accent transition-colors"
                      title="Project settings"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
