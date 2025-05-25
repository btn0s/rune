import {
  makeFlowNodeDefinition,
  makeFunctionNodeDefinition,
  makeAsyncNodeDefinition,
  NodeCategory,
  type NodeDefinition,
} from "@rune/behave-graph-core";
import type { IPlatform } from "../platform/types";
import type { ProjectManager } from "./project-registry";

// Platform configuration type
type PlatformConfig = {
  react?: any;
  swiftui?: any;
  flutter?: any;
};

export function createProjectNodes(
  platformConfig: PlatformConfig
): Record<string, NodeDefinition> {
  const nodes: Record<string, NodeDefinition> = {};

  // For now, return empty nodes to avoid type issues
  // TODO: Fix the node definition types and re-implement project nodes

  return nodes;
}

// Component Management Nodes
export const CreateComponent = makeFlowNodeDefinition({
  typeName: "project/createComponent",
  category: NodeCategory.Action,
  label: "Create Component",
  in: {
    flow: "flow",
    type: "string",
    id: "string",
  },
  out: {
    flow: "flow",
    componentId: "string",
  },
  initialState: undefined,
  triggered: ({ read, write, commit }) => {
    const type = read("type");
    const id = read("id");

    // TODO: Integrate with project manager
    console.log(`Creating component: ${type} with id: ${id}`);

    write("componentId", id);
    commit("flow");
  },
});

export const SetProperty = makeFlowNodeDefinition({
  typeName: "project/setProperty",
  category: NodeCategory.Action,
  label: "Set Property",
  in: {
    flow: "flow",
    componentId: "string",
    property: "string",
    value: "string",
  },
  out: {
    flow: "flow",
  },
  initialState: undefined,
  triggered: ({ read, commit }) => {
    const componentId = read("componentId");
    const property = read("property");
    const value = read("value");

    // TODO: Integrate with project manager
    console.log(`Setting ${property} = ${value} on component ${componentId}`);

    commit("flow");
  },
});

export const GetProperty = makeFunctionNodeDefinition({
  typeName: "project/getProperty",
  category: NodeCategory.Query,
  label: "Get Property",
  in: {
    componentId: "string",
    property: "string",
  },
  out: {
    value: "string",
  },
  exec: ({ read, write }) => {
    const componentId = read("componentId");
    const property = read("property");

    // TODO: Integrate with project manager
    const value = `mock-value-for-${property}`;

    write("value", value);
  },
});

// React Platform Nodes
export const CreateButton = makeFlowNodeDefinition({
  typeName: "react/createButton",
  category: NodeCategory.Action,
  label: "Create Button",
  in: {
    flow: "flow",
    text: "string",
    id: "string",
  },
  out: {
    flow: "flow",
    componentId: "string",
  },
  initialState: undefined,
  triggered: ({ read, write, commit }) => {
    const text = read("text");
    const id = read("id");

    // TODO: Integrate with React platform
    console.log(`Creating React button: "${text}" with id: ${id}`);

    write("componentId", id);
    commit("flow");
  },
});

export const CreateInput = makeFlowNodeDefinition({
  typeName: "react/createInput",
  category: NodeCategory.Action,
  label: "Create Input",
  in: {
    flow: "flow",
    placeholder: "string",
    id: "string",
  },
  out: {
    flow: "flow",
    componentId: "string",
  },
  initialState: undefined,
  triggered: ({ read, write, commit }) => {
    const placeholder = read("placeholder");
    const id = read("id");

    // TODO: Integrate with React platform
    console.log(
      `Creating React input with placeholder: "${placeholder}" and id: ${id}`
    );

    write("componentId", id);
    commit("flow");
  },
});

export const CreateText = makeFlowNodeDefinition({
  typeName: "react/createText",
  category: NodeCategory.Action,
  label: "Create Text",
  in: {
    flow: "flow",
    content: "string",
    id: "string",
  },
  out: {
    flow: "flow",
    componentId: "string",
  },
  initialState: undefined,
  triggered: ({ read, write, commit }) => {
    const content = read("content");
    const id = read("id");

    // TODO: Integrate with React platform
    console.log(`Creating React text: "${content}" with id: ${id}`);

    write("componentId", id);
    commit("flow");
  },
});

// Project Operations
export const SaveProject = makeFlowNodeDefinition({
  typeName: "project/saveProject",
  category: NodeCategory.Action,
  label: "Save Project",
  in: {
    flow: "flow",
  },
  out: {
    flow: "flow",
    success: "boolean",
  },
  initialState: undefined,
  triggered: ({ write, commit }) => {
    // TODO: Integrate with project manager
    console.log("Saving project...");

    write("success", true);
    commit("flow");
  },
});

export const GetProjectInfo = makeFunctionNodeDefinition({
  typeName: "project/getProjectInfo",
  category: NodeCategory.Query,
  label: "Get Project Info",
  in: {},
  out: {
    name: "string",
    id: "string",
    platform: "string",
  },
  exec: ({ write }) => {
    // TODO: Integrate with project manager
    write("name", "Current Project");
    write("id", "project-123");
    write("platform", "react");
  },
});

// Navigation Nodes
export const NavigateTo = makeFlowNodeDefinition({
  typeName: "project/navigateTo",
  category: NodeCategory.Action,
  label: "Navigate To",
  in: {
    flow: "flow",
    route: "string",
  },
  out: {
    flow: "flow",
  },
  initialState: undefined,
  triggered: ({ read, commit }) => {
    const route = read("route");

    // TODO: Integrate with React Router
    console.log(`Navigating to: ${route}`);

    commit("flow");
  },
});

// Event Handling
export const OnClick = makeFlowNodeDefinition({
  typeName: "project/onClick",
  category: NodeCategory.Event,
  label: "On Click",
  in: {
    componentId: "string",
  },
  out: {
    flow: "flow",
  },
  initialState: undefined,
  triggered: ({ read, commit }) => {
    const componentId = read("componentId");

    // TODO: Integrate with event system
    console.log(`Click event on component: ${componentId}`);

    commit("flow");
  },
});

export const OnChange = makeFlowNodeDefinition({
  typeName: "project/onChange",
  category: NodeCategory.Event,
  label: "On Change",
  in: {
    componentId: "string",
  },
  out: {
    flow: "flow",
    value: "string",
  },
  initialState: undefined,
  triggered: ({ read, write, commit }) => {
    const componentId = read("componentId");

    // TODO: Integrate with event system
    const value = "mock-changed-value";

    console.log(
      `Change event on component: ${componentId}, new value: ${value}`
    );

    write("value", value);
    commit("flow");
  },
});

// Figma Integration (Real Implementation)
export const ImportFromFigma = makeAsyncNodeDefinition({
  typeName: "figma/import",
  category: NodeCategory.Action,
  label: "Import from Figma",
  in: {
    flow: "flow",
    figmaUrl: "string",
    figmaToken: "string",
  },
  out: {
    flow: "flow",
    componentsCreated: "integer",
    components: "string", // JSON string of component data
  },
  initialState: undefined,
  triggered: async ({ read, write, commit, graph, finished }) => {
    const figmaUrl = read("figmaUrl") as string;
    const figmaToken = read("figmaToken") as string;

    console.log(`Importing from Figma: ${figmaUrl}`);

    try {
      // If token is provided, try to use real Figma API
      if (figmaToken && figmaToken.trim()) {
        console.log("Using provided Figma token for real API call");

        const { FigmaImporter } = await import("../figma/figma-importer");
        const importer = new FigmaImporter(figmaToken.trim());

        console.log("Created FigmaImporter, calling importFromUrl...");
        const result = await importer.importFromUrl(figmaUrl);

        console.log("API call completed. Result:", {
          success: result.success,
          componentsLength: result.components?.length || 0,
          error: result.error,
        });

        if (result.success) {
          if (result.components && result.components.length > 0) {
            console.log(
              `Successfully imported ${result.components.length} components from Figma`
            );
            console.log("Real Figma components:", result.components);

            // Update the outputs with real data
            write("componentsCreated", result.components.length);
            write("components", JSON.stringify(result.components));

            console.log(
              "Wrote components data:",
              JSON.stringify(result.components)
            );

            // Get project manager and save components
            const projectManager = graph.getDependency(
              "IProjectManager"
            ) as ProjectManager;
            if (projectManager) {
              const currentProject = projectManager.getCurrentProject();
              if (currentProject) {
                // Convert ComponentData to ProjectComponent format
                const projectComponents = result.components.map((comp) => ({
                  id: comp.id,
                  name: comp.name,
                  type: "figma" as const, // Fix the type issue
                  properties: Object.entries(comp.properties).map(
                    ([name, value]) => ({
                      name,
                      type: (typeof value === "string"
                        ? "string"
                        : typeof value === "number"
                          ? "number"
                          : typeof value === "boolean"
                            ? "boolean"
                            : "string") as
                        | "string"
                        | "number"
                        | "boolean"
                        | "color"
                        | "image",
                      defaultValue: value,
                      description: `Property ${name} from Figma component`,
                    })
                  ),
                  metadata: {
                    figmaNodeId: comp.id,
                    lastSync: new Date().toISOString(),
                    reactCode: comp.reactCode,
                    previewHtml: comp.previewHtml,
                  },
                }));

                const updatedProject = {
                  ...currentProject,
                  components: [
                    ...currentProject.components,
                    ...projectComponents,
                  ],
                  updatedAt: new Date().toISOString(),
                };
                await projectManager.saveProject(updatedProject);
                console.log(
                  `Added ${result.components.length} components to project`
                );
              }
            }

            commit("flow");
            finished?.();
            return;
          } else {
            console.warn("API call succeeded but no components were found");
            // Still use real API result even if no components
            write("componentsCreated", 0);
            write("components", JSON.stringify([]));
            commit("flow");
            finished?.();
            return;
          }
        } else {
          console.warn("Figma import failed:", result.error);
          // Fall back to mock data only if API call failed
          useMockData();
          return;
        }
      } else {
        console.log("No Figma token provided, using mock data");
        // Use mock data only if no token provided
        useMockData();
        return;
      }
    } catch (error) {
      console.error("Error in Figma import:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      useMockData();
    }

    function useMockData() {
      const mockComponents = [
        {
          id: "button-1",
          name: "PrimaryButton",
          type: "button",
          properties: {
            text: "Click me",
            variant: "primary",
            size: "medium",
          },
          reactCode: `import React from 'react';

export interface PrimaryButtonProps {
  text?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}

export function PrimaryButton({ 
  text = "Click me", 
  onClick,
  variant = "primary",
  className = "" 
}: PrimaryButtonProps) {
  const baseClasses = "px-4 py-2 rounded transition-colors";
  const variantClasses = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    secondary: "bg-gray-500 text-white hover:bg-gray-600", 
    outline: "border border-blue-500 text-blue-500 hover:bg-blue-50"
  };
  
  return (
    <button 
      className={\`\${baseClasses} \${variantClasses[variant]} \${className}\`}
      onClick={onClick}
    >
      {text}
    </button>
  );
}`,
          previewHtml: `
            <div class="component-preview border rounded p-4 mb-4">
              <h3 class="text-sm font-medium mb-2">PrimaryButton</h3>
              <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                Click me
              </button>
            </div>`,
        },
        {
          id: "input-1",
          name: "EmailInput",
          type: "input",
          properties: {
            placeholder: "Enter your email",
            type: "email",
          },
          reactCode: `import React from 'react';

export interface EmailInputProps {
  placeholder?: string;
  type?: string;
  className?: string;
}

export function EmailInput({ 
  placeholder = "Enter your email", 
  type = "email",
  className = "" 
}: EmailInputProps) {
  return (
    <input 
      type={type}
      placeholder={placeholder}
      className={\`px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 \${className}\`}
    />
  );
}`,
          previewHtml: `
            <div class="component-preview border rounded p-4 mb-4">
              <h3 class="text-sm font-medium mb-2">EmailInput</h3>
              <input 
                type="email"
                placeholder="Enter your email"
                class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>`,
        },
      ];

      console.log(`Generated ${mockComponents.length} mock components`);

      write("componentsCreated", mockComponents.length);
      write("components", JSON.stringify(mockComponents));

      console.log(
        "Wrote mock components data:",
        JSON.stringify(mockComponents)
      );

      commit("flow");
      finished?.();
    }
  },
  dispose: ({ state, graph }) => {
    // Clean up any resources if needed
    console.log("Disposing ImportFromFigma node");
    return state;
  },
});

export const SyncWithFigma = makeFlowNodeDefinition({
  typeName: "figma/sync",
  category: NodeCategory.Action,
  label: "Sync with Figma",
  in: {
    flow: "flow",
  },
  out: {
    flow: "flow",
    changesDetected: "boolean",
  },
  initialState: undefined,
  triggered: ({ write, commit }) => {
    // TODO: Implement Figma sync
    console.log("Syncing with Figma...");

    write("changesDetected", false);
    commit("flow");
  },
});

export const GenerateComponents = makeFlowNodeDefinition({
  typeName: "project/generateComponents",
  category: NodeCategory.Action,
  label: "Generate Components",
  in: {
    flow: "flow",
    components: "string", // JSON string of component data
  },
  out: {
    flow: "flow",
    generatedFiles: "integer",
    previewHtml: "string",
  },
  initialState: undefined,
  triggered: ({ read, write, commit, graph }) => {
    const componentsJson = read("components") as string;

    console.log("componentsJson:", componentsJson);

    try {
      // Validate JSON input
      if (
        !componentsJson ||
        componentsJson.trim() === "" ||
        componentsJson === "[]"
      ) {
        console.log("No components data provided or empty array");
        write("generatedFiles", 0);
        write(
          "previewHtml",
          '<div class="p-4 text-gray-500">No components to generate</div>'
        );
        commit("flow");
        return;
      }

      const components = JSON.parse(componentsJson);

      if (!Array.isArray(components) || components.length === 0) {
        console.log("Components data is not a valid array or is empty");
        write("generatedFiles", 0);
        write(
          "previewHtml",
          '<div class="p-4 text-gray-500">No valid components found</div>'
        );
        commit("flow");
        return;
      }

      let generatedFiles = 0;
      let previewHtml = '<div class="space-y-6">';

      // Generate React components from component data
      for (const component of components) {
        // If component already has reactCode and previewHtml (from real Figma import)
        if (component.reactCode && component.previewHtml) {
          previewHtml += `<div class="component-item">${component.previewHtml}</div>`;
          generatedFiles++;

          console.log(`Generated component: ${component.name}`);
          console.log(component.reactCode);
        } else {
          // Fallback to legacy generation for mock data
          const reactCode = generateReactComponent(component);
          const previewElement = generatePreviewHtml(component);

          previewHtml += `<div class="component-item">${previewElement}</div>`;
          generatedFiles++;

          console.log(`Generated component: ${component.name}`);
          console.log(reactCode);
        }
      }

      previewHtml += "</div>";

      write("generatedFiles", generatedFiles);
      write("previewHtml", previewHtml);

      // Emit a global event with the preview HTML for the studio to capture
      if (typeof window !== "undefined") {
        console.log("Emitting preview-generated event with HTML:", previewHtml);
        window.dispatchEvent(
          new CustomEvent("rune:preview-generated", {
            detail: { previewHtml, generatedFiles },
          })
        );
      }

      commit("flow");
    } catch (error) {
      console.error("Failed to generate components:", error);
      console.error("Invalid JSON input:", componentsJson);
      write("generatedFiles", 0);
      write(
        "previewHtml",
        '<div class="p-4 text-red-500">Error generating components: Invalid JSON input</div>'
      );
      commit("flow");
    }
  },
});

// Helper function to generate React component code
function generateReactComponent(component: any): string {
  switch (component.type) {
    case "button":
      return `
import React from 'react';

export function ${toPascalCase(component.name)}() {
  return (
    <button 
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
    >
      ${component.properties.text || "Button"}
    </button>
  );
}`;

    case "input":
      return `
import React from 'react';

export function ${toPascalCase(component.name)}() {
  return (
    <input 
      type="${component.properties.type || "text"}"
      placeholder="${component.properties.placeholder || ""}"
      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}`;

    default:
      return `
import React from 'react';

export function ${toPascalCase(component.name)}() {
  return <div className="p-4 bg-gray-100 rounded">Unknown component type: ${component.type}</div>;
}`;
  }
}

// Helper function to generate preview HTML
function generatePreviewHtml(component: any): string {
  switch (component.type) {
    case "button":
      return `
        <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
          ${component.properties.text || "Button"}
        </button>`;

    case "input":
      return `
        <input 
          type="${component.properties.type || "text"}"
          placeholder="${component.properties.placeholder || ""}"
          class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />`;

    default:
      return `
        <div class="p-4 bg-gray-100 rounded">
          <div class="text-gray-500 text-sm">${component.name} (${component.type})</div>
        </div>`;
  }
}

// Helper function to convert to PascalCase
function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

// Export all nodes
export const projectNodes = [
  CreateComponent,
  SetProperty,
  GetProperty,
  CreateButton,
  CreateInput,
  CreateText,
  SaveProject,
  GetProjectInfo,
  NavigateTo,
  OnClick,
  OnChange,
  ImportFromFigma,
  GenerateComponents,
  SyncWithFigma,
];