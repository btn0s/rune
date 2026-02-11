import { z } from "zod";
import { registerTool } from "../mcp";
import { sendCommand } from "../bridge";

const rgbaSchema = z.object({
  r: z.number().min(0).max(1).describe("Red (0-1)"),
  g: z.number().min(0).max(1).describe("Green (0-1)"),
  b: z.number().min(0).max(1).describe("Blue (0-1)"),
  a: z.number().min(0).max(1).optional().describe("Alpha (0-1)"),
});

const nodeDefSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z
      .enum(["FRAME", "RECTANGLE", "ELLIPSE", "TEXT", "LINE", "VECTOR"])
      .describe("Node type to create"),
    name: z.string().optional().describe("Node name"),
    x: z.number().optional().describe("X position (relative to parent)"),
    y: z.number().optional().describe("Y position (relative to parent)"),
    width: z.number().positive().optional().describe("Width (required for FRAME, RECTANGLE, ELLIPSE)"),
    height: z.number().positive().optional().describe("Height (required for FRAME, RECTANGLE, ELLIPSE)"),
    // Style
    fillColor: rgbaSchema.optional().describe("Fill color"),
    strokeColor: rgbaSchema.optional().describe("Stroke color"),
    strokeWeight: z.number().positive().optional().describe("Stroke weight"),
    strokeAlign: z.enum(["INSIDE", "OUTSIDE", "CENTER"]).optional().describe("Stroke alignment"),
    cornerRadius: z.number().min(0).optional().describe("Corner radius"),
    opacity: z.number().min(0).max(1).optional().describe("Opacity (0-1)"),
    // Layout (frames only)
    layoutMode: z.enum(["NONE", "HORIZONTAL", "VERTICAL"]).optional().describe("Auto-layout direction"),
    layoutWrap: z.enum(["NO_WRAP", "WRAP"]).optional().describe("Wrap mode"),
    paddingTop: z.number().min(0).optional(),
    paddingRight: z.number().min(0).optional(),
    paddingBottom: z.number().min(0).optional(),
    paddingLeft: z.number().min(0).optional(),
    itemSpacing: z.number().min(0).optional().describe("Gap between children"),
    primaryAxisAlignItems: z.enum(["MIN", "MAX", "CENTER", "SPACE_BETWEEN"]).optional(),
    counterAxisAlignItems: z.enum(["MIN", "MAX", "CENTER", "BASELINE"]).optional(),
    layoutSizingHorizontal: z.enum(["FIXED", "HUG", "FILL"]).optional(),
    layoutSizingVertical: z.enum(["FIXED", "HUG", "FILL"]).optional(),
    // Text-specific
    text: z.string().optional().describe("Text content (TEXT nodes only)"),
    fontSize: z.number().positive().optional().describe("Font size"),
    fontFamily: z.string().optional().describe("Font family"),
    fontWeight: z.number().optional().describe("Font weight (100-900)"),
    fontColor: rgbaSchema.optional().describe("Text color"),
    textAlignHorizontal: z.enum(["LEFT", "CENTER", "RIGHT", "JUSTIFIED"]).optional(),
    letterSpacing: z.number().optional().describe("Letter spacing as percentage"),
    lineHeight: z.union([z.number().positive(), z.literal("AUTO")]).optional().describe("Line height in pixels or 'AUTO'"),
    startX: z.number().optional(),
    startY: z.number().optional(),
    endX: z.number().optional(),
    endY: z.number().optional(),
    svgPath: z.string().optional().describe("SVG path data for VECTOR nodes"),
    children: z.array(nodeDefSchema).optional().describe("Child nodes to create recursively"),
  }),
);

// ─── create_nodes_batch ──────────────────────────────────────────────────────

registerTool("create_nodes_batch", {
  title: "Create Nodes Batch",
  description:
    "Create multiple nodes from a JSON tree structure in a single call. " +
    "Each node definition can include children, which are created recursively. " +
    "Supports FRAME, RECTANGLE, ELLIPSE, TEXT, and LINE node types with full styling and layout options. " +
    "Returns a flat map of created nodes keyed by their name (or auto-generated key).",
  inputSchema: {
    parentId: z.string().optional().describe("Parent node ID to append the root nodes to (defaults to current page)"),
    nodes: z.array(nodeDefSchema).min(1).describe("Array of node definitions to create (supports nested children)"),
  },
}, async (args) => {
  return await sendCommand("create_nodes_batch", args, 60_000);
});
