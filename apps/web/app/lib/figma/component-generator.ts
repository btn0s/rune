import type { FigmaNode } from "./figma-client";

export interface ComponentData {
  id: string;
  name: string;
  type: string;
  properties: Record<string, any>;
  reactCode: string;
  previewHtml: string;
}

// Helper function to convert Figma node name to a valid React component name
function toComponentName(name: string): string {
  return name
    .replace(/[^\w\s-]/g, "")
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

// Convert Figma styles to Tailwind classes
function figmaStylesToTailwind(node: FigmaNode): string[] {
  const classes: string[] = [];

  // Handle basic styling
  if (node.absoluteBoundingBox) {
    const { width, height } = node.absoluteBoundingBox;

    // Add responsive width/height if reasonable
    if (width < 100) classes.push("w-auto");
    else if (width < 200) classes.push("w-48");
    else if (width < 400) classes.push("w-96");
    else classes.push("w-full");

    if (height < 50) classes.push("h-auto");
    else if (height < 100) classes.push("h-12");
    else classes.push("h-auto");
  }

  // Handle fills (background colors)
  if (node.fills && node.fills.length > 0) {
    const fill = node.fills[0];
    if (fill.type === "SOLID" && fill.color) {
      const { r, g, b } = fill.color;
      // Convert to approximate Tailwind colors
      if (r > 0.8 && g > 0.8 && b > 0.8) classes.push("bg-gray-100");
      else if (r < 0.2 && g < 0.2 && b < 0.2) classes.push("bg-gray-900");
      else if (r > 0.5 && g < 0.3 && b < 0.3) classes.push("bg-red-500");
      else if (r < 0.3 && g > 0.5 && b < 0.3) classes.push("bg-green-500");
      else if (r < 0.3 && g < 0.3 && b > 0.5) classes.push("bg-blue-500");
      else classes.push("bg-gray-200");
    }
  }

  // Handle strokes (borders)
  if (node.strokes && node.strokes.length > 0) {
    classes.push("border");
    const stroke = node.strokes[0];
    if (stroke.color) {
      const { r, g, b } = stroke.color;
      if (r < 0.3 && g < 0.3 && b < 0.3) classes.push("border-gray-800");
      else classes.push("border-gray-300");
    }
  }

  // Handle corner radius
  if (node.cornerRadius && node.cornerRadius > 0) {
    if (node.cornerRadius < 4) classes.push("rounded-sm");
    else if (node.cornerRadius < 8) classes.push("rounded");
    else if (node.cornerRadius < 16) classes.push("rounded-lg");
    else classes.push("rounded-xl");
  }

  // Handle text styling
  if (node.type === "TEXT") {
    classes.push("text-gray-900");

    // Add text size based on font size
    if (node.style?.fontSize) {
      const fontSize = node.style.fontSize;
      if (fontSize < 14) classes.push("text-sm");
      else if (fontSize < 18) classes.push("text-base");
      else if (fontSize < 24) classes.push("text-lg");
      else if (fontSize < 32) classes.push("text-xl");
      else classes.push("text-2xl");
    }

    // Add font weight
    if (node.style?.fontWeight) {
      const weight = node.style.fontWeight;
      if (weight >= 700) classes.push("font-bold");
      else if (weight >= 600) classes.push("font-semibold");
      else if (weight >= 500) classes.push("font-medium");
    }
  }

  return classes;
}

// Convert a single Figma node to a React component
export function figmaNodeToComponent(node: FigmaNode): ComponentData {
  const componentName = toComponentName(node.name);
  const tailwindClasses = figmaStylesToTailwind(node);
  const classString = tailwindClasses.join(" ");

  let reactCode = "";
  let previewHtml = "";
  let properties: Record<string, any> = {};

  switch (node.type) {
    case "TEXT":
      const textContent = node.characters || "Text";
      properties = {
        text: textContent,
        fontSize: node.style?.fontSize || 16,
        fontWeight: node.style?.fontWeight || 400,
      };

      reactCode = `import React from 'react';

export interface ${componentName}Props {
  text?: string;
  className?: string;
}

export function ${componentName}({ 
  text = "${textContent}", 
  className = "" 
}: ${componentName}Props) {
  return (
    <p className={\`${classString} \${className}\`}>
      {text}
    </p>
  );
}`;

      previewHtml = `
        <p class="${classString}">${textContent}</p>`;
      break;

    case "RECTANGLE":
    case "FRAME":
      // Check if this looks like a button
      if (
        node.name.toLowerCase().includes("button") ||
        node.name.toLowerCase().includes("btn")
      ) {
        const buttonText =
          node.children?.find((child) => child.type === "TEXT")?.characters ||
          "Button";
        properties = {
          text: buttonText,
          variant: "primary",
          size: "medium",
        };

        reactCode = `import React from 'react';

export interface ${componentName}Props {
  text?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}

export function ${componentName}({ 
  text = "${buttonText}", 
  onClick,
  variant = "primary",
  className = "" 
}: ${componentName}Props) {
  const baseClasses = "${classString}";
  const variantClasses = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    secondary: "bg-gray-500 text-white hover:bg-gray-600", 
    outline: "border border-blue-500 text-blue-500 hover:bg-blue-50"
  };
  
  return (
    <button 
      className={\`\${baseClasses} \${variantClasses[variant]} \${className} px-4 py-2 rounded transition-colors\`}
      onClick={onClick}
    >
      {text}
    </button>
  );
}`;

        previewHtml = `
          <button class="${classString} px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
            ${buttonText}
          </button>`;
      } else {
        // Generic container/div
        properties = {
          width: node.absoluteBoundingBox?.width || "auto",
          height: node.absoluteBoundingBox?.height || "auto",
        };

        reactCode = `import React from 'react';

export interface ${componentName}Props {
  children?: React.ReactNode;
  className?: string;
}

export function ${componentName}({ 
  children, 
  className = "" 
}: ${componentName}Props) {
  return (
    <div className={\`${classString} \${className}\`}>
      {children}
    </div>
  );
}`;

        previewHtml = `
          <div class="${classString}">
            <div class="text-gray-500 text-sm p-4">${componentName}</div>
          </div>`;
      }
      break;

    default:
      // Fallback for unknown types
      properties = { type: node.type };

      reactCode = `import React from 'react';

export interface ${componentName}Props {
  className?: string;
}

export function ${componentName}({ className = "" }: ${componentName}Props) {
  return (
    <div className={\`${classString} \${className}\`}>
      {/* ${node.type} component */}
    </div>
  );
}`;

      previewHtml = `
        <div class="${classString}">
          <div class="text-gray-500 text-sm p-4">${componentName} (${node.type})</div>
        </div>`;
  }

  return {
    id: node.id,
    name: componentName,
    type: node.type.toLowerCase(),
    properties,
    reactCode,
    previewHtml,
  };
}

// Process multiple Figma nodes and generate components
export function generateComponentsFromNodes(
  nodes: FigmaNode[]
): ComponentData[] {
  return nodes.map((node) => figmaNodeToComponent(node));
}

// Helper to find interesting nodes in a Figma document
export function findComponentNodes(document: FigmaNode): FigmaNode[] {
  const components: FigmaNode[] = [];

  function traverse(node: FigmaNode) {
    // Include nodes that look like components
    if (
      node.type === "COMPONENT" ||
      node.type === "INSTANCE" ||
      (node.type === "FRAME" && node.name && !node.name.startsWith("_")) ||
      (node.type === "TEXT" && node.characters) ||
      (node.type === "RECTANGLE" && node.name.toLowerCase().includes("button"))
    ) {
      components.push(node);
    }

    // Traverse children
    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(document);
  return components;
}
