import { z } from "zod";
import { registerTool } from "../mcp";
import { sendCommand } from "../bridge";

// ─── find_node_in_subtree ────────────────────────────────────────────────────

registerTool("find_node_in_subtree", {
  title: "Find Node in Subtree",
  description:
    "Search for nodes within a specific subtree (not the entire page). " +
    "Find descendants by name, type, or path. Useful after cloning a frame " +
    "to locate specific children without manually drilling through get_node_children. " +
    "Returns matching nodes with their path from the root node.",
  inputSchema: {
    nodeId: z.string().describe("Root node ID to search within"),
    name: z
      .string()
      .optional()
      .describe("Search by name (case-insensitive, partial match)"),
    type: z
      .string()
      .optional()
      .describe("Filter by node type (e.g. FRAME, TEXT, RECTANGLE)"),
    path: z
      .string()
      .optional()
      .describe(
        'Search by path using "/" separators (e.g. "Header/Title"). ' +
        "Matches node name segments from root to target. Case-insensitive.",
      ),
    maxDepth: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe("Maximum depth to search (default: unlimited)"),
    maxResults: z
      .number()
      .int()
      .min(1)
      .max(200)
      .optional()
      .describe("Maximum results to return (default: 50)"),
  },
}, async (args) => {
  return await sendCommand("find_node_in_subtree", args);
});
