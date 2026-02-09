import { z } from "zod";
import { registerTool } from "../mcp";
import { sendCommand } from "../bridge";

// ─── Document Info ───────────────────────────────────────────────────────────

registerTool("get_document_info", {
  title: "Get Document Info",
  description:
    "Get information about the current Figma document including name, pages list, and current page.",
}, async () => {
  return await sendCommand("get_document_info");
});

// ─── Page Navigation ─────────────────────────────────────────────────────────

registerTool("set_current_page", {
  title: "Set Current Page",
  description: "Switch to a different page by name or ID.",
  inputSchema: {
    pageNameOrId: z
      .string()
      .describe("The name or ID of the page to switch to"),
  },
}, async (args) => {
  return await sendCommand("set_current_page", args);
});

registerTool("create_page", {
  title: "Create Page",
  description: "Create a new page in the document.",
  inputSchema: {
    name: z.string().describe("Name for the new page"),
  },
}, async (args) => {
  return await sendCommand("create_page", args);
});

// ─── Node Navigation ─────────────────────────────────────────────────────────

registerTool("get_node_by_id", {
  title: "Get Node By ID",
  description:
    "Get detailed information about a specific node including type, name, bounds, parent, and children names/ids. Filtered to exclude vectorPaths, imageRef, and boundVariables.",
  inputSchema: {
    nodeId: z.string().describe("The ID of the node to inspect"),
  },
}, async (args) => {
  return await sendCommand("get_node_by_id", args);
});

registerTool("get_node_children", {
  title: "Get Node Children",
  description:
    "Get paginated children of a node. Returns id, name, type, and bounds for each child.",
  inputSchema: {
    nodeId: z.string().describe("The ID of the parent node"),
    offset: z
      .number()
      .int()
      .min(0)
      .default(0)
      .describe("Starting index (default 0)"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(200)
      .default(50)
      .describe("Max children to return (default 50, max 200)"),
  },
}, async (args) => {
  return await sendCommand("get_node_children", args);
});

registerTool("find_nodes", {
  title: "Find Nodes",
  description:
    "Search for nodes on the current page by name (case-insensitive contains) and/or by type. At least one filter must be provided. Returns up to 100 results.",
  inputSchema: {
    name: z
      .string()
      .optional()
      .describe("Search by name (case-insensitive, partial match)"),
    type: z
      .string()
      .optional()
      .describe(
        "Filter by node type (e.g. FRAME, TEXT, RECTANGLE, COMPONENT, INSTANCE)",
      ),
  },
}, async (args) => {
  return await sendCommand("find_nodes", args);
});

// ─── Selection ───────────────────────────────────────────────────────────────

registerTool("get_selection", {
  title: "Get Selection",
  description: "Get information about the currently selected nodes in Figma.",
}, async () => {
  return await sendCommand("get_selection");
});

registerTool("set_selection", {
  title: "Set Selection",
  description: "Select specific nodes by their IDs.",
  inputSchema: {
    nodeIds: z
      .array(z.string())
      .describe("Array of node IDs to select"),
  },
}, async (args) => {
  return await sendCommand("set_selection", args);
});

// ─── Viewport ────────────────────────────────────────────────────────────────

registerTool("get_viewport", {
  title: "Get Viewport",
  description:
    "Get the current viewport center position, zoom level, and visible bounds.",
}, async () => {
  return await sendCommand("get_viewport");
});

registerTool("set_viewport", {
  title: "Set Viewport",
  description: "Set the viewport center position and optionally the zoom level.",
  inputSchema: {
    x: z.number().describe("X coordinate of viewport center"),
    y: z.number().describe("Y coordinate of viewport center"),
    zoom: z
      .number()
      .positive()
      .optional()
      .describe("Zoom level (e.g. 1 = 100%, 0.5 = 50%)"),
  },
}, async (args) => {
  return await sendCommand("set_viewport", args);
});

registerTool("zoom_to_fit", {
  title: "Zoom to Fit",
  description:
    "Zoom the viewport to fit specific nodes. If no nodeIds provided, zooms to fit the current selection.",
  inputSchema: {
    nodeIds: z
      .array(z.string())
      .optional()
      .describe(
        "Optional array of node IDs to zoom to. Uses current selection if omitted.",
      ),
  },
}, async (args) => {
  return await sendCommand("zoom_to_fit", args);
});
