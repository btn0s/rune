import { z } from "zod";
import { registerTool } from "../mcp";
import { sendCommand } from "../bridge";
import { getPreset } from "../presets";
import { applyPresetToNode } from "./presets";

const rgbaSchema = z.object({
  r: z.number().min(0).max(1).describe("Red (0-1)"),
  g: z.number().min(0).max(1).describe("Green (0-1)"),
  b: z.number().min(0).max(1).describe("Blue (0-1)"),
  a: z.number().min(0).max(1).optional().describe("Alpha (0-1)"),
});

const presetSchema = z
  .string()
  .optional()
  .describe('Style preset name (e.g. "ambrook-warm"). Requires role to also be set.');
const roleSchema = z
  .string()
  .optional()
  .describe('Preset role to auto-apply (e.g. "card", "input", "title"). Requires preset to also be set.');

function stripPresetArgs(args: Record<string, unknown>): Record<string, unknown> {
  const { preset: _p, role: _r, ...rest } = args;
  return rest;
}

async function maybeApplyPreset(
  nodeId: string,
  args: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  const preset = args.preset as string | undefined;
  const role = args.role as string | undefined;
  if (!preset || !role) return null;

  const presetDef = getPreset(preset);
  if (!presetDef) throw new Error(`Unknown preset "${preset}"`);

  const roleDef = presetDef.roles[role];
  if (!roleDef) throw new Error(`Unknown role "${role}" in preset "${preset}"`);

  return applyPresetToNode(nodeId, preset, roleDef.tokens, role);
}

registerTool("create_rectangle", {
  description:
    "Create a rectangle in Figma. Optionally pass preset + role to auto-style it on creation.",
  inputSchema: {
    x: z.number().describe("X position"),
    y: z.number().describe("Y position"),
    width: z.number().positive().describe("Width"),
    height: z.number().positive().describe("Height"),
    name: z.string().optional().describe("Node name"),
    parentId: z.string().optional().describe("Parent node ID to append to"),
    fillColor: rgbaSchema.optional().describe("Fill color"),
    strokeColor: rgbaSchema.optional().describe("Stroke color"),
    strokeWeight: z.number().positive().optional().describe("Stroke weight"),
    strokeAlign: z.enum(["INSIDE", "OUTSIDE", "CENTER"]).optional().describe("Stroke alignment"),
    cornerRadius: z.number().min(0).optional().describe("Corner radius"),
    preset: presetSchema,
    role: roleSchema,
  },
}, async (args) => {
  const result = (await sendCommand("create_rectangle", stripPresetArgs(args))) as { id: string };
  const presetResult = await maybeApplyPreset(result.id, args);
  return presetResult ? { ...result, presetApplied: presetResult } : result;
});

registerTool("create_ellipse", {
  description: "Create an ellipse in Figma",
  inputSchema: {
    x: z.number().describe("X position"),
    y: z.number().describe("Y position"),
    width: z.number().positive().describe("Width"),
    height: z.number().positive().describe("Height"),
    name: z.string().optional().describe("Node name"),
    parentId: z.string().optional().describe("Parent node ID to append to"),
    fillColor: rgbaSchema.optional().describe("Fill color"),
    strokeColor: rgbaSchema.optional().describe("Stroke color"),
    strokeWeight: z.number().positive().optional().describe("Stroke weight"),
    strokeAlign: z.enum(["INSIDE", "OUTSIDE", "CENTER"]).optional().describe("Stroke alignment"),
  },
}, async (args) => {
  return sendCommand("create_ellipse", args);
});

registerTool("create_line", {
  description: "Create a line in Figma between two points",
  inputSchema: {
    startX: z.number().describe("Start X"),
    startY: z.number().describe("Start Y"),
    endX: z.number().describe("End X"),
    endY: z.number().describe("End Y"),
    name: z.string().optional().describe("Node name"),
    parentId: z.string().optional().describe("Parent node ID to append to"),
    strokeColor: rgbaSchema.optional().describe("Stroke color"),
    strokeWeight: z.number().positive().optional().describe("Stroke weight"),
    strokeAlign: z.enum(["INSIDE", "OUTSIDE", "CENTER"]).optional().describe("Stroke alignment"),
  },
}, async (args) => {
  return sendCommand("create_line", args);
});

registerTool("create_frame", {
  description:
    "Create a frame in Figma with optional auto-layout. " +
    "Pass preset + role to auto-style on creation (e.g. role=\"card\", role=\"input\").",
  inputSchema: {
    x: z.number().describe("X position"),
    y: z.number().describe("Y position"),
    width: z.number().positive().describe("Width"),
    height: z.number().positive().describe("Height"),
    name: z.string().optional().describe("Node name"),
    parentId: z.string().optional().describe("Parent node ID to append to"),
    fillColor: rgbaSchema.optional().describe("Fill color"),
    strokeColor: rgbaSchema.optional().describe("Stroke color"),
    strokeWeight: z.number().positive().optional().describe("Stroke weight"),
    strokeAlign: z.enum(["INSIDE", "OUTSIDE", "CENTER"]).optional().describe("Stroke alignment"),
    layoutMode: z.enum(["NONE", "HORIZONTAL", "VERTICAL"]).optional().describe("Auto-layout direction"),
    layoutWrap: z.enum(["NO_WRAP", "WRAP"]).optional().describe("Whether auto-layout wraps children"),
    paddingTop: z.number().min(0).optional().describe("Top padding"),
    paddingRight: z.number().min(0).optional().describe("Right padding"),
    paddingBottom: z.number().min(0).optional().describe("Bottom padding"),
    paddingLeft: z.number().min(0).optional().describe("Left padding"),
    itemSpacing: z.number().min(0).optional().describe("Gap between children"),
    primaryAxisAlignItems: z.enum(["MIN", "MAX", "CENTER", "SPACE_BETWEEN"]).optional().describe("Main axis alignment"),
    counterAxisAlignItems: z.enum(["MIN", "MAX", "CENTER", "BASELINE"]).optional().describe("Cross axis alignment"),
    layoutSizingHorizontal: z.enum(["FIXED", "HUG", "FILL"]).optional().describe("Horizontal sizing"),
    layoutSizingVertical: z.enum(["FIXED", "HUG", "FILL"]).optional().describe("Vertical sizing"),
    preset: presetSchema,
    role: roleSchema,
  },
}, async (args) => {
  const result = (await sendCommand("create_frame", stripPresetArgs(args))) as { id: string };
  const presetResult = await maybeApplyPreset(result.id, args);
  return presetResult ? { ...result, presetApplied: presetResult } : result;
});

registerTool("create_group", {
  description: "Group existing nodes together in Figma",
  inputSchema: {
    nodeIds: z.array(z.string()).min(1).describe("IDs of nodes to group"),
    name: z.string().optional().describe("Group name"),
  },
}, async (args) => {
  return sendCommand("create_group", args);
});

registerTool("create_component", {
  description: "Create a new component in Figma",
  inputSchema: {
    x: z.number().describe("X position"),
    y: z.number().describe("Y position"),
    width: z.number().positive().describe("Width"),
    height: z.number().positive().describe("Height"),
    name: z.string().optional().describe("Component name"),
    parentId: z.string().optional().describe("Parent node ID to append to"),
    fillColor: rgbaSchema.optional().describe("Fill color"),
  },
}, async (args) => {
  return sendCommand("create_component", args);
});

registerTool("create_instance", {
  description: "Create an instance of an existing component in Figma",
  inputSchema: {
    componentKey: z.string().describe("Component key to instantiate"),
    x: z.number().describe("X position"),
    y: z.number().describe("Y position"),
    name: z.string().optional().describe("Instance name"),
    parentId: z.string().optional().describe("Parent node ID to append to"),
  },
}, async (args) => {
  return sendCommand("create_instance", args);
});

registerTool("create_text", {
  description:
    "Create a text node in Figma (loads font automatically). " +
    "Pass preset + role to auto-style on creation (e.g. role=\"title\", role=\"hint\", role=\"link\").",
  inputSchema: {
    x: z.number().describe("X position"),
    y: z.number().describe("Y position"),
    text: z.string().describe("Text content"),
    fontSize: z.number().positive().optional().describe("Font size (default: 14)"),
    fontFamily: z.string().optional().describe("Font family (default: Inter)"),
    fontWeight: z.number().optional().describe("Font weight (100-900, default: 400)"),
    fontColor: rgbaSchema.optional().describe("Text color"),
    textAlignHorizontal: z.enum(["LEFT", "CENTER", "RIGHT", "JUSTIFIED"]).optional().describe("Horizontal text alignment"),
    letterSpacing: z.number().optional().describe("Letter spacing as percentage (e.g. 10 = 10%)"),
    lineHeight: z.union([z.number().positive(), z.literal("AUTO")]).optional().describe("Line height in pixels, or 'AUTO'"),
    name: z.string().optional().describe("Node name"),
    parentId: z.string().optional().describe("Parent node ID to append to"),
    preset: presetSchema,
    role: roleSchema,
  },
}, async (args) => {
  const result = (await sendCommand("create_text", stripPresetArgs(args))) as { id: string };
  const presetResult = await maybeApplyPreset(result.id, args);
  return presetResult ? { ...result, presetApplied: presetResult } : result;
});

registerTool("create_vector", {
  description: "Create a vector node in Figma from SVG path data. Supports arbitrary shapes via SVG path commands (M, L, C, Q, Z, etc.).",
  inputSchema: {
    x: z.number().describe("X position"),
    y: z.number().describe("Y position"),
    width: z.number().positive().optional().describe("Width to resize to"),
    height: z.number().positive().optional().describe("Height to resize to"),
    svgPath: z.string().describe("SVG path data string (e.g. 'M 0 0 L 100 0 L 100 100 Z')"),
    name: z.string().optional().describe("Node name"),
    parentId: z.string().optional().describe("Parent node ID to append to"),
    fillColor: rgbaSchema.optional().describe("Fill color"),
    strokeColor: rgbaSchema.optional().describe("Stroke color"),
    strokeWeight: z.number().positive().optional().describe("Stroke weight"),
    strokeAlign: z.enum(["INSIDE", "OUTSIDE", "CENTER"]).optional().describe("Stroke alignment"),
  },
}, async (args) => {
  return sendCommand("create_vector", args);
});
