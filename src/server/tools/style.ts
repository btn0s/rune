import { z } from "zod";
import { registerTool } from "../mcp";
import { sendCommand } from "../bridge";
import { parseColor } from "@shared/color";

const rgbaSchema = z.object({
  r: z.number().min(0).max(1).describe("Red (0-1)"),
  g: z.number().min(0).max(1).describe("Green (0-1)"),
  b: z.number().min(0).max(1).describe("Blue (0-1)"),
  a: z.number().min(0).max(1).optional().describe("Alpha (0-1, default 1)"),
});

const colorSchema = z
  .union([
    z.string().describe('Hex color: "#FF5500", "#F50", "#FF550088"'),
    rgbaSchema,
  ])
  .describe("Color as hex string or RGBA object");

function resolveColor(input: unknown): { r: number; g: number; b: number; a?: number } | null {
  if (input === null || input === undefined) return null;
  return parseColor(input as string | { r: number; g: number; b: number; a?: number });
}

// ─── set_style ───────────────────────────────────────────────────────────────

registerTool("set_style", {
  title: "Set Style",
  description:
    "Set visual style properties on a node. All properties are optional — only provided ones are changed. Pass null for fillColor/strokeColor to remove them.",
  inputSchema: {
    nodeId: z.string().describe("Target node ID"),
    fillColor: colorSchema
      .nullable()
      .optional()
      .describe("Fill color (null to remove)"),
    strokeColor: colorSchema
      .nullable()
      .optional()
      .describe("Stroke color (null to remove)"),
    strokeWeight: z.number().positive().optional().describe("Stroke weight in px"),
    strokeAlign: z
      .enum(["INSIDE", "OUTSIDE", "CENTER"])
      .optional()
      .describe("Stroke alignment"),
    cornerRadius: z
      .union([
        z.number().min(0).describe("Uniform corner radius"),
        z.object({
          topLeft: z.number().min(0).optional(),
          topRight: z.number().min(0).optional(),
          bottomRight: z.number().min(0).optional(),
          bottomLeft: z.number().min(0).optional(),
        }).describe("Per-corner radius"),
      ])
      .optional()
      .describe("Corner radius: number (uniform) or per-corner object"),
    opacity: z.number().min(0).max(1).optional().describe("Node opacity (0-1)"),
    visible: z.boolean().optional().describe("Node visibility"),
  },
}, async (args) => {
  const params: Record<string, unknown> = { nodeId: args.nodeId };

  if (args.fillColor !== undefined) {
    params.fillColor = args.fillColor === null ? null : resolveColor(args.fillColor);
  }
  if (args.strokeColor !== undefined) {
    params.strokeColor = args.strokeColor === null ? null : resolveColor(args.strokeColor);
  }
  if (args.strokeWeight !== undefined) params.strokeWeight = args.strokeWeight;
  if (args.strokeAlign !== undefined) params.strokeAlign = args.strokeAlign;
  if (args.cornerRadius !== undefined) params.cornerRadius = args.cornerRadius;
  if (args.opacity !== undefined) params.opacity = args.opacity;
  if (args.visible !== undefined) params.visible = args.visible;

  return await sendCommand("set_style", params);
});

// ─── add_effect ──────────────────────────────────────────────────────────────

registerTool("add_effect", {
  title: "Add Effect",
  description:
    "Add a visual effect to a node. Appends to existing effects without removing them.",
  inputSchema: {
    nodeId: z.string().describe("Target node ID"),
    type: z
      .enum(["DROP_SHADOW"])
      .describe("Effect type"),
    color: colorSchema
      .optional()
      .describe("Effect color (default: black at 25% opacity)"),
    offsetX: z.number().optional().describe("Horizontal offset (default 0)"),
    offsetY: z.number().optional().describe("Vertical offset (default 4)"),
    blurRadius: z.number().min(0).optional().describe("Blur radius (default 4)"),
    spread: z.number().optional().describe("Spread distance (default 0)"),
  },
}, async (args) => {
  const params: Record<string, unknown> = {
    nodeId: args.nodeId,
    type: args.type,
    offsetX: args.offsetX,
    offsetY: args.offsetY,
    blurRadius: args.blurRadius,
    spread: args.spread,
  };

  if (args.color !== undefined) {
    params.color = resolveColor(args.color);
  }

  return await sendCommand("add_effect", params);
});

// ─── remove_effects ──────────────────────────────────────────────────────────

registerTool("remove_effects", {
  title: "Remove Effects",
  description: "Remove all effects from a node.",
  inputSchema: {
    nodeId: z.string().describe("Target node ID"),
  },
}, async (args) => {
  return await sendCommand("remove_effects", args);
});

// ─── get_node_style ──────────────────────────────────────────────────────────

registerTool("get_node_style", {
  title: "Get Node Style",
  description:
    "Get complete style information for a node: fills, strokes, effects, corner radius, opacity, blend mode, visibility, and lock state.",
  inputSchema: {
    nodeId: z.string().describe("Target node ID"),
  },
}, async (args) => {
  return await sendCommand("get_node_style", args);
});

// ─── set_locked ──────────────────────────────────────────────────────────────

registerTool("set_locked", {
  title: "Set Locked",
  description: "Lock or unlock a node. Locked nodes cannot be selected or edited by users.",
  inputSchema: {
    nodeId: z.string().describe("Target node ID"),
    locked: z.boolean().describe("true to lock, false to unlock"),
  },
}, async (args) => {
  return await sendCommand("set_locked", args);
});
