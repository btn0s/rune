import { z } from "zod";
import { registerTool } from "../mcp";
import { sendCommand } from "../bridge";

// ─── Auto-Layout ──────────────────────────────────────────────────────────────

registerTool("set_auto_layout", {
  title: "Set Auto-Layout",
  description:
    "Configure a frame as an auto-layout container. Set direction to HORIZONTAL or VERTICAL to enable, or NONE to remove auto-layout. Optionally configure padding, spacing, alignment, and wrap.",
  inputSchema: {
    nodeId: z.string().describe("The ID of the frame node"),
    direction: z
      .enum(["HORIZONTAL", "VERTICAL", "NONE"])
      .describe("Auto-layout direction. NONE removes auto-layout."),
    paddingTop: z.number().min(0).optional().describe("Top padding in pixels"),
    paddingRight: z.number().min(0).optional().describe("Right padding in pixels"),
    paddingBottom: z.number().min(0).optional().describe("Bottom padding in pixels"),
    paddingLeft: z.number().min(0).optional().describe("Left padding in pixels"),
    itemSpacing: z
      .number()
      .min(0)
      .optional()
      .describe("Spacing between children in pixels"),
    primaryAxisAlignItems: z
      .enum(["MIN", "MAX", "CENTER", "SPACE_BETWEEN"])
      .optional()
      .describe("Alignment along the primary axis"),
    counterAxisAlignItems: z
      .enum(["MIN", "MAX", "CENTER", "BASELINE"])
      .optional()
      .describe("Alignment along the counter axis"),
    layoutWrap: z
      .enum(["NO_WRAP", "WRAP"])
      .optional()
      .describe("Whether children wrap to new lines"),
    counterAxisSpacing: z
      .number()
      .min(0)
      .optional()
      .describe("Spacing between wrapped rows/columns (only applies when layoutWrap is WRAP)"),
  },
}, async (args) => {
  return await sendCommand("set_auto_layout", args);
});

// ─── Layout Sizing ────────────────────────────────────────────────────────────

registerTool("set_layout_sizing", {
  title: "Set Layout Sizing",
  description:
    "Set the horizontal and/or vertical sizing mode of a node (FIXED, HUG, or FILL). Use on auto-layout frames or children within auto-layout frames.",
  inputSchema: {
    nodeId: z.string().describe("The ID of the node"),
    horizontal: z
      .enum(["FIXED", "HUG", "FILL"])
      .optional()
      .describe("Horizontal sizing mode"),
    vertical: z
      .enum(["FIXED", "HUG", "FILL"])
      .optional()
      .describe("Vertical sizing mode"),
  },
}, async (args) => {
  return await sendCommand("set_layout_sizing", args);
});

// ─── Layout Align ─────────────────────────────────────────────────────────────

registerTool("set_layout_align", {
  title: "Set Layout Align",
  description:
    "Set how a child node aligns and grows within its auto-layout parent. Use layoutAlign STRETCH to make the child fill the counter axis, or INHERIT to use the parent's counterAxisAlignItems. Use layoutGrow 1 to make the child expand along the primary axis.",
  inputSchema: {
    nodeId: z.string().describe("The ID of the child node within an auto-layout frame"),
    layoutAlign: z
      .enum(["STRETCH", "INHERIT"])
      .optional()
      .describe("Counter-axis alignment: STRETCH fills the counter axis, INHERIT uses parent setting"),
    layoutGrow: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe("Primary-axis growth: 0 = fixed size, 1 = fill remaining space"),
  },
}, async (args) => {
  return await sendCommand("set_layout_align", args);
});

// ─── Transform: Move ──────────────────────────────────────────────────────────

registerTool("move_node", {
  title: "Move Node",
  description: "Move a node to a new position by setting its x and y coordinates.",
  inputSchema: {
    nodeId: z.string().describe("The ID of the node to move"),
    x: z.number().describe("New X position"),
    y: z.number().describe("New Y position"),
  },
}, async (args) => {
  return await sendCommand("move_node", args);
});

// ─── Transform: Resize ────────────────────────────────────────────────────────

registerTool("resize_node", {
  title: "Resize Node",
  description: "Resize a node to new dimensions.",
  inputSchema: {
    nodeId: z.string().describe("The ID of the node to resize"),
    width: z.number().positive().describe("New width in pixels"),
    height: z.number().positive().describe("New height in pixels"),
  },
}, async (args) => {
  return await sendCommand("resize_node", args);
});

// ─── Transform: Rotation ──────────────────────────────────────────────────────

registerTool("set_rotation", {
  title: "Set Rotation",
  description: "Set the rotation of a node in degrees.",
  inputSchema: {
    nodeId: z.string().describe("The ID of the node to rotate"),
    rotation: z.number().describe("Rotation angle in degrees (0-360)"),
  },
}, async (args) => {
  return await sendCommand("set_rotation", args);
});
