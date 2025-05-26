import React, { useMemo } from "react";

interface ComponentPreviewProps {
  previewHtml: string;
  title?: string;
}

export function ComponentPreview({
  previewHtml,
  title = "Component Preview",
}: ComponentPreviewProps) {
  const iframeSrc = useMemo(() => {
    // Create the HTML content with Tailwind CSS
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en" style="background: #141414; height: 100%; width: 100%;">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Component Preview</title>
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
      </head>
      <body style="height: 100%; width: 100%;">
        ${previewHtml}
      </body>
      </html>
    `;

    // Create a data URL for the iframe
    return `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
  }, [previewHtml]);

  return (
    <iframe
      src={iframeSrc}
      className="w-full h-full border rounded-md bg-background"
      title={title}
      sandbox="allow-scripts"
    />
  );
}
