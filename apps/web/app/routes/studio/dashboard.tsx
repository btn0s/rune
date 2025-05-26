import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { ProjectManager } from "~/components/project-manager";
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
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const storage = await getProjectStorage();
      const templateList = await storage.listTemplates();
      setTemplates(templateList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
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
          <p className="text-muted-foreground">Loading...</p>
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
                <h1 className="text-sm font-bold">Rune Studio</h1>
                <p className="text-xs text-muted-foreground">
                  Visual Development Platform
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/studio/new"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Import from Figma
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

        {/* Main Project Manager */}
        <ProjectManager />

        {/* Quick Start Templates - Optional for future expansion */}
        {templates.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-semibold mb-4">
              Quick Start Templates
            </h2>
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
        )}
      </div>
    </div>
  );
}
