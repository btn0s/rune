import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { getProjectStorage } from "~/lib/storage/project-storage";
import type { ProjectTemplate } from "~/lib/types/project";

export function meta() {
  return [
    { title: "New Project - Rune Studio" },
    { name: "description", content: "Create a new Rune project" },
  ];
}

export default function NewProject() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    platform: "react",
    template: "",
    figmaFileKey: "",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Project name is required");
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const storage = await getProjectStorage();
      const project = await storage.createProject({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        platform: formData.platform,
        template: formData.template || undefined,
        figmaFileKey: formData.figmaFileKey.trim() || undefined,
      });

      navigate(`/studio/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setFormData((prev) => ({
        ...prev,
        template: templateId,
        platform: template.platform,
        name: prev.name || template.name,
        description: prev.description || template.description,
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading templates...</p>
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
              <Link to="/studio" className="flex items-center gap-3">
                <img
                  src="/logo.svg"
                  className="size-8 border border-foreground/20 rounded-md overflow-hidden"
                  alt="Rune"
                />
                <div>
                  <h1 className="text-xl font-bold">Rune Studio</h1>
                  <p className="text-sm text-muted-foreground">New Project</p>
                </div>
              </Link>
            </div>
            <Link
              to="/studio"
              className="px-3 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors"
            >
              Back to Projects
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Project Form */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Project Details</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-2"
                >
                  Project Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="My Awesome App"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="A brief description of your project"
                  rows={3}
                />
              </div>

              <div>
                <label
                  htmlFor="platform"
                  className="block text-sm font-medium mb-2"
                >
                  Platform
                </label>
                <select
                  id="platform"
                  value={formData.platform}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      platform: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="react">React</option>
                  <option value="swiftui" disabled>
                    SwiftUI (Coming Soon)
                  </option>
                  <option value="flutter" disabled>
                    Flutter (Coming Soon)
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="figmaFileKey"
                  className="block text-sm font-medium mb-2"
                >
                  Figma File Key (Optional)
                </label>
                <input
                  type="text"
                  id="figmaFileKey"
                  value={formData.figmaFileKey}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      figmaFileKey: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="abc123def456..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Found in Figma URL: figma.com/file/[FILE_KEY]/...
                </p>
              </div>

              <button
                type="submit"
                disabled={creating || !formData.name.trim()}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? "Creating Project..." : "Create Project"}
              </button>
            </form>
          </div>

          {/* Template Selection */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Choose a Template</h2>
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.template === template.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-foreground/40"
                  }`}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        formData.template === template.id
                          ? "bg-primary"
                          : "bg-muted-foreground"
                      }`}
                    ></div>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {template.category}
                    </span>
                  </div>
                  <h3 className="font-medium mb-1">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-1 bg-accent rounded">
                      {template.platform}
                    </span>
                    {formData.template === template.id && (
                      <span className="text-xs text-primary font-medium">
                        Selected
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
