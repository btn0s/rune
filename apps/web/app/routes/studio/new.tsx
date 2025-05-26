import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { FigmaTokenSettings } from "~/components/flow/FigmaTokenSettings";
import { createFigmaImporter } from "~/lib/figma/figma-importer";

export function meta() {
  return [
    { title: "Import from Figma - Rune Studio" },
    { name: "description", content: "Import designs from Figma" },
  ];
}

export default function NewProject() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [figmaToken, setFigmaToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    figmaUrl: "",
    startDevServer: true,
  });

  useEffect(() => {
    // Check if Figma token is configured
    const token = localStorage.getItem("figma_token");
    setFigmaToken(token);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Project name is required");
      return;
    }

    if (!formData.figmaUrl.trim()) {
      setError("Figma URL is required");
      return;
    }

    if (!figmaToken) {
      setError("Please configure your Figma token first");
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const importer = createFigmaImporter();
      if (!importer) {
        setError("Failed to initialize Figma importer");
        return;
      }

      // Import from Figma and create project
      const result = await importer.importFromUrl(formData.figmaUrl, {
        createProject: true,
        projectName: formData.name.trim(),
        projectDescription: formData.description.trim() || undefined,
        startDevServer: formData.startDevServer,
      });

      if (!result.success) {
        setError(result.error || "Failed to import from Figma");
        return;
      }

      if (!result.project) {
        setError("Project was not created");
        return;
      }

      // Navigate to project management page or show success
      navigate(`/studio/projects/${result.project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleTokenSaved = (token: string) => {
    setFigmaToken(token);
  };

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
                  <p className="text-sm text-muted-foreground">
                    Import from Figma
                  </p>
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

      <div className="container mx-auto px-6 py-8 max-w-2xl">
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

        <div className="space-y-6">
          {/* Figma Token Configuration */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Figma Configuration</h2>
            <FigmaTokenSettings onTokenSaved={handleTokenSaved} />
          </div>

          {/* Project Form */}
          {figmaToken && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Import Details</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="figmaUrl"
                    className="block text-sm font-medium mb-2"
                  >
                    Figma URL *
                  </label>
                  <input
                    type="url"
                    id="figmaUrl"
                    value={formData.figmaUrl}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        figmaUrl: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://www.figma.com/file/..."
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Paste the full Figma file or frame URL
                  </p>
                </div>

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
                    placeholder="My Figma Project"
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
                    placeholder="Imported from Figma design"
                    rows={3}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="startDevServer"
                    checked={formData.startDevServer}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        startDevServer: e.target.checked,
                      }))
                    }
                    className="mr-2"
                  />
                  <label
                    htmlFor="startDevServer"
                    className="text-sm text-foreground"
                  >
                    Start dev server automatically
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={
                    creating ||
                    !formData.name.trim() ||
                    !formData.figmaUrl.trim()
                  }
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? "Importing from Figma..." : "Import Project"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
