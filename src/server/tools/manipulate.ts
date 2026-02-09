import { z } from "zod";
import { registerTool } from "../mcp";
import { sendCommand } from "../bridge";

// ─── Delete Node ──────────────────────────────────────────────────────────────

registerTool("delete_node", {
  title: "Delete Node",
  description:
    "Delete one or more nodes from the Figma document. Accepts a single nodeId or an array of nodeIds for bulk deletion.",
  inputSchema: {
    nodeId: z
      .string()
      .optional()
      .describe("The ID of a single node to delete"),
    nodeIds: z
      .array(z.string())
      .optional()
      .describe("Array of node IDs to delete (for bulk deletion)"),
  },
}, async (args) => {
  return await sendCommand("delete_node", args);
});

// ─── Clone Node ───────────────────────────────────────────────────────────────

registerTool("clone_node", {
  title: "Clone Node",
  description:
    "Create a duplicate of an existing node. Optionally place the clone at a specific position.",
  inputSchema: {
    nodeId: z.string().describe("The ID of the node to clone"),
    x: z
      .number()
      .optional()
      .describe("X position for the cloned node"),
    y: z
      .number()
      .optional()
      .describe("Y position for the cloned node"),
  },
}, async (args) => {
  return await sendCommand("clone_node", args);
});

// ─── Rename Node ──────────────────────────────────────────────────────────────

registerTool("rename_node", {
  title: "Rename Node",
  description: "Change the name of a node in the Figma document.",
  inputSchema: {
    nodeId: z.string().describe("The ID of the node to rename"),
    name: z.string().describe("The new name for the node"),
  },
}, async (args) => {
  return await sendCommand("rename_node", args);
});

// ─── Reparent Node ────────────────────────────────────────────────────────────

registerTool("reparent_node", {
  title: "Reparent Node",
  description:
    "Move a node to a different parent. Can also be used to reorder children within the same parent by specifying an index.",
  inputSchema: {
    nodeId: z.string().describe("The ID of the node to move"),
    newParentId: z.string().describe("The ID of the new parent node"),
    index: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe(
        "Position index within the new parent's children (appends to end if omitted)",
      ),
  },
}, async (args) => {
  return await sendCommand("reparent_node", args);
});
