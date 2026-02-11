import { z } from "zod";
import { registerTool } from "../mcp";
import { sendCommand } from "../bridge";

// ─── copy_style_from_node ────────────────────────────────────────────────────

registerTool("copy_style_from_node", {
  title: "Copy Style From Node",
  description:
    "Copy visual style properties from a source node to one or more target nodes. " +
    "Copies fills, strokes, effects, corner radius, opacity, and stroke weight/align. " +
    "Optionally specify which properties to copy. Useful for matching existing wireframe styles.",
  inputSchema: {
    sourceNodeId: z.string().describe("ID of the node to copy styles from"),
    targetNodeIds: z
      .array(z.string())
      .min(1)
      .describe("IDs of nodes to apply the copied styles to"),
    properties: z
      .array(
        z.enum([
          "fills",
          "strokes",
          "effects",
          "cornerRadius",
          "opacity",
          "strokeWeight",
          "strokeAlign",
        ]),
      )
      .optional()
      .describe(
        "Which properties to copy (default: all). " +
        "Options: fills, strokes, effects, cornerRadius, opacity, strokeWeight, strokeAlign",
      ),
  },
}, async (args) => {
  return await sendCommand("copy_style_from_node", args);
});

// ─── get_node_computed_styles ────────────────────────────────────────────────

registerTool("get_node_computed_styles", {
  title: "Get Node Computed Styles",
  description:
    "Extract a complete serialized style token from a reference node. " +
    "Returns all visual properties in a format that can be directly used " +
    "with set_style or copy_style_from_node. Includes fills, strokes, effects, " +
    "corner radius, opacity, layout properties, and text styles if applicable.",
  inputSchema: {
    nodeId: z.string().describe("ID of the node to extract styles from"),
    includeLayout: z
      .boolean()
      .optional()
      .describe("Include layout properties like auto-layout, padding, spacing (default: false)"),
    includeText: z
      .boolean()
      .optional()
      .describe("Include text style properties like font, size, weight (default: false for non-text nodes)"),
  },
}, async (args) => {
  return await sendCommand("get_node_computed_styles", args);
});
