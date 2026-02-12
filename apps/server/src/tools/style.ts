import { z } from "zod";
import sharp from "sharp";
import { registerTool } from "../mcp";
import { sendCommand } from "../bridge";
import { parseColor } from "@workspace/shared/color";
import { logger } from "../logger";

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
    gradientFill: z.object({
      type: z.enum(["GRADIENT_LINEAR", "GRADIENT_RADIAL", "GRADIENT_ANGULAR", "GRADIENT_DIAMOND"]).describe("Gradient type"),
      stops: z.array(z.object({
        position: z.number().min(0).max(1).describe("Stop position (0-1)"),
        color: colorSchema.describe("Stop color"),
      })).min(2).describe("Color stops (min 2)"),
      transform: z.array(z.array(z.number())).optional().describe("2x3 gradient transform matrix [[a,b,c],[d,e,f]]"),
    }).optional().describe("Gradient fill (replaces solid fill)"),
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

  if (args.gradientFill !== undefined) {
    const gf = args.gradientFill as { type: string; stops: Array<{ position: number; color: unknown }>; transform?: number[][] };
    params.gradientFill = {
      type: gf.type,
      stops: gf.stops.map(s => ({
        position: s.position,
        color: resolveColor(s.color),
      })),
      transform: gf.transform,
    };
  }

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
      .enum(["DROP_SHADOW", "INNER_SHADOW", "LAYER_BLUR", "BACKGROUND_BLUR"])
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

// ─── set_image_fill ──────────────────────────────────────────────────────────

registerTool("set_image_fill", {
  title: "Set Image Fill",
  description:
    "Set a node's fill to an image fetched from a URL. Fetches the image, optimizes it with sharp, " +
    "and applies it as an image fill on the target node. Works with any public image URL " +
    "(e.g. Unsplash: https://images.unsplash.com/photo-..., Picsum: https://picsum.photos/800/600).",
  inputSchema: {
    nodeId: z.string().describe("Target node ID"),
    imageUrl: z.string().url().describe("URL of the image to fetch"),
    scaleMode: z
      .enum(["FILL", "FIT", "CROP", "TILE"])
      .optional()
      .describe("How the image is scaled within the node (default: FILL)"),
    maxDimension: z
      .number()
      .min(64)
      .max(4096)
      .optional()
      .describe("Max width or height in pixels before downscaling (default: 2048)"),
  },
}, async (args) => {
  const nodeId = args.nodeId as string;
  const imageUrl = args.imageUrl as string;
  const scaleMode = (args.scaleMode as string) ?? "FILL";
  const maxDimension = (args.maxDimension as number) ?? 2048;

  const response = await fetch(imageUrl, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`URL did not return an image (got ${contentType})`);
  }

  const rawBuffer = Buffer.from(await response.arrayBuffer());
  logger.info(`set_image_fill: fetched ${rawBuffer.length} bytes from ${imageUrl}`);

  const optimized = await sharp(rawBuffer)
    .resize({
      width: maxDimension,
      height: maxDimension,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png({
      compressionLevel: 6,
      adaptiveFiltering: true,
    })
    .toBuffer();

  const base64 = optimized.toString("base64");
  logger.info(`set_image_fill: optimized to ${optimized.length} bytes`);

  return await sendCommand("set_image_fill", { nodeId, base64, scaleMode });
});
