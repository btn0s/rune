import type { FigmaNode } from "./figma-client";
import { convertFigmaStylesToTailwind } from "./figma-tailwind-converter";
import { enhanceWithAccessibility } from "./accessibility";

export interface ComponentData {
  id: string;
  name: string;
  type: string;
  properties: Record<string, any>;
  reactCode: string;
  previewHtml: string;
}

interface PropDefinition {
  name: string;
  type: string;
  defaultValue?: string;
  description?: string;
}

// Helper function to convert Figma node name to a valid React component name
function toComponentName(name: string): string {
  return name
    .replace(/[^\w\s-]/g, "")
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

// Helper function to convert Figma node name to a valid prop name
function toPropName(name: string): string {
  const parts = name.replace(/[^\w\s-]/g, "").split(/[-_\s]+/);

  return (
    parts[0].toLowerCase() +
    parts
      .slice(1)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("")
  );
}

// Extract potential props from Figma node
function extractProps(node: FigmaNode): PropDefinition[] {
  const props: PropDefinition[] = [];

  // Text content could be a prop
  if (node.type === "TEXT" && node.characters) {
    const propName = toPropName(node.name) || "text";
    props.push({
      name: propName,
      type: "string",
      defaultValue: JSON.stringify(node.characters),
      description: `Text content for ${node.name}`,
    });
  }

  // If node has a "variant" property, it could be a prop
  if (node.name.toLowerCase().includes("variant")) {
    props.push({
      name: "variant",
      type: "'primary' | 'secondary' | 'outline' | 'text'",
      defaultValue: "'primary'",
      description: "Visual variant of the component",
    });
  }

  // If node looks like a button, add onClick prop
  if (
    node.name.toLowerCase().includes("button") ||
    node.name.toLowerCase().includes("btn")
  ) {
    props.push({
      name: "onClick",
      type: "() => void",
      description: "Function called when button is clicked",
    });
  }

  // If node has children that could be dynamic, add children prop
  if (node.children && node.children.length > 0) {
    if (
      node.name.toLowerCase().includes("container") ||
      node.name.toLowerCase().includes("wrapper") ||
      node.name.toLowerCase().includes("layout") ||
      node.name.toLowerCase().includes("section")
    ) {
      props.push({
        name: "children",
        type: "React.ReactNode",
        description: "Child elements to render inside the component",
      });
    }
  }

  // Add className prop for styling customization
  props.push({
    name: "className",
    type: "string",
    description: "Additional CSS classes to apply",
  });

  return props;
}

// Convert a Figma node to JSX with enhanced styling
function figmaNodeToJSX(
  node: FigmaNode,
  level = 0
): { jsx: string; props: PropDefinition[] } {
  const tailwindClasses = convertFigmaStylesToTailwind(node);
  const classString = tailwindClasses.join(" ");
  const nodeProps = extractProps(node);

  let jsx = "";

  switch (node.type) {
    case "TEXT":
      const textContent = node.characters || "Text";
      const textProp =
        nodeProps.find((p) => p.name.includes("text")) || nodeProps[0];

      jsx = `<p className="${classString}">{${textProp?.name || "text"}}</p>`;
      break;

    case "IMAGE":
      jsx = `<img 
  src="${node.name.toLowerCase().replace(/\s+/g, "-")}.png" 
  className="${classString}" 
  alt="${node.name}"
/>`;
      break;

    case "RECTANGLE":
    case "ELLIPSE":
    case "POLYGON":
    case "STAR":
    case "VECTOR":
    case "LINE":
      jsx = `<div className="${classString}"></div>`;
      break;

    case "COMPONENT":
    case "INSTANCE":
    case "FRAME":
    case "GROUP":
      // Process children if they exist
      let childrenJSX = "";
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          const childResult = figmaNodeToJSX(child, level + 1);
          childrenJSX += `\n${"  ".repeat(level + 1)}${childResult.jsx}`;
        }
        childrenJSX += `\n${"  ".repeat(level)}`;
      }

      // Check if this looks like a button
      if (
        node.name.toLowerCase().includes("button") ||
        node.name.toLowerCase().includes("btn")
      ) {
        jsx = `<button 
  className="${classString}"
  onClick={onClick}
>${childrenJSX}</button>`;
      } else {
        // Check if we should use children prop
        const hasChildrenProp = nodeProps.some((p) => p.name === "children");

        jsx = `<div className="${classString}">
${hasChildrenProp ? "{children}" : childrenJSX}</div>`;
      }
      break;

    default:
      jsx = `<div className="${classString}">
  {/* ${node.type} component */}
</div>`;
  }

  return { jsx, props: nodeProps };
}

// Convert a single Figma node to a React component
export function figmaNodeToComponent(node: FigmaNode): ComponentData {
  const componentName = toComponentName(node.name);
  const { jsx, props } = figmaNodeToJSX(node);

  // Enhance with accessibility features
  const enhancedJSX = enhanceWithAccessibility(jsx, node);

  // Deduplicate props
  const uniqueProps = props.filter(
    (prop, index, self) => index === self.findIndex((p) => p.name === prop.name)
  );

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
  ${uniqueProps
    .map(
      (prop) =>
        `/** ${prop.description || ""} */
  ${prop.name}${prop.type.includes("?") || prop.defaultValue ? "?" : ""}: ${prop.type};`
    )
    .join("\n  ")}
}

export function ${componentName}({ 
  ${uniqueProps
    .map((p) => (p.defaultValue ? `${p.name} = ${p.defaultValue}` : p.name))
    .join(", ")} 
}: ${componentName}Props) {
  return (
    ${enhancedJSX}
  );
}`;

      previewHtml = enhancedJSX.replace(/\{[^}]+\}/g, textContent);
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
  ${uniqueProps
    .map(
      (prop) =>
        `/** ${prop.description || ""} */
  ${prop.name}${prop.type.includes("?") || prop.defaultValue ? "?" : ""}: ${prop.type};`
    )
    .join("\n  ")}
}

export function ${componentName}({ 
  ${uniqueProps
    .map((p) => (p.defaultValue ? `${p.name} = ${p.defaultValue}` : p.name))
    .join(", ")} 
}: ${componentName}Props) {
  return (
    ${enhancedJSX}
  );
}`;

        previewHtml = enhancedJSX.replace(/\{[^}]+\}/g, buttonText);
      } else {
        // Generic container/div
        properties = {
          width: node.absoluteBoundingBox?.width || "auto",
          height: node.absoluteBoundingBox?.height || "auto",
        };

        reactCode = `import React from 'react';

export interface ${componentName}Props {
  ${uniqueProps
    .map(
      (prop) =>
        `/** ${prop.description || ""} */
  ${prop.name}${prop.type.includes("?") || prop.defaultValue ? "?" : ""}: ${prop.type};`
    )
    .join("\n  ")}
}

export function ${componentName}({ 
  ${uniqueProps
    .map((p) => (p.defaultValue ? `${p.name} = ${p.defaultValue}` : p.name))
    .join(", ")} 
}: ${componentName}Props) {
  return (
    ${enhancedJSX}
  );
}`;

        previewHtml = enhancedJSX.replace(
          /\{children\}/g,
          `<div class="text-gray-500 text-sm p-4">${componentName}</div>`
        );
      }
      break;

    case "IMAGE":
      properties = {
        src: `${node.name.toLowerCase().replace(/\s+/g, "-")}.png`,
        alt: node.name,
      };

      reactCode = `import React from 'react';

export interface ${componentName}Props {
  ${uniqueProps
    .map(
      (prop) =>
        `/** ${prop.description || ""} */
  ${prop.name}${prop.type.includes("?") || prop.defaultValue ? "?" : ""}: ${prop.type};`
    )
    .join("\n  ")}
}

export function ${componentName}({ 
  ${uniqueProps
    .map((p) => (p.defaultValue ? `${p.name} = ${p.defaultValue}` : p.name))
    .join(", ")} 
}: ${componentName}Props) {
  return (
    ${enhancedJSX}
  );
}`;

      previewHtml = enhancedJSX.replace(
        /src="[^"]*"/g,
        `src="https://via.placeholder.com/150"`
      );
      break;

    default:
      // Fallback for unknown types
      properties = { type: node.type };

      reactCode = `import React from 'react';

export interface ${componentName}Props {
  ${uniqueProps
    .map(
      (prop) =>
        `/** ${prop.description || ""} */
  ${prop.name}${prop.type.includes("?") || prop.defaultValue ? "?" : ""}: ${prop.type};`
    )
    .join("\n  ")}
}

export function ${componentName}({ 
  ${uniqueProps
    .map((p) => (p.defaultValue ? `${p.name} = ${p.defaultValue}` : p.name))
    .join(", ")} 
}: ${componentName}Props) {
  return (
    ${enhancedJSX}
  );
}`;

      previewHtml = enhancedJSX.replace(
        /\{[^}]+\}/g,
        `${componentName} (${node.type})`
      );
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
      (node.type === "RECTANGLE" &&
        node.name.toLowerCase().includes("button")) ||
      node.type === "IMAGE" ||
      node.type === "VECTOR" ||
      node.type === "ELLIPSE"
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
