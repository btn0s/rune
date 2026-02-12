import { z } from "zod";
import sharp from "sharp";
import { registerRawTool } from "../mcp";
import { sendCommand } from "../bridge";
import { logger } from "../logger";

// ─── screenshot ──────────────────────────────────────────────────────────────

registerRawTool("screenshot", {
  title: "Screenshot",
  description:
    "Take a screenshot of a node (or the current selection) and return an optimized PNG image. " +
    "Useful for visual inspection of designs. Returns the image directly as viewable content. " +
    "Optionally specify a scale multiplier (default 1) and max dimension to keep images reasonably sized.",
  inputSchema: {
    nodeId: z
      .string()
      .optional()
      .describe("ID of the node to screenshot. Uses current selection if omitted."),
    scale: z
      .number()
      .min(0.01)
      .max(4)
      .optional()
      .describe("Export scale multiplier (default: 1). Use 2 for retina-quality."),
    maxDimension: z
      .number()
      .min(64)
      .max(4096)
      .optional()
      .describe(
        "Maximum width or height in pixels (default: 1024). " +
        "Image is downscaled if either dimension exceeds this, preserving aspect ratio.",
      ),
  },
}, async (args) => {
  const nodeId = args.nodeId as string | undefined;
  const scale = (args.scale as number) ?? 1;
  const maxDimension = (args.maxDimension as number) ?? 1024;

  const result = await sendCommand("export_png", { nodeId, scale }) as {
    base64: string;
    width?: number;
    height?: number;
    nodeId: string;
    nodeName: string;
  };

  const rawBuffer = Buffer.from(result.base64, "base64");
  logger.info(`Screenshot raw PNG: ${rawBuffer.length} bytes from "${result.nodeName}"`);

  const optimized = await sharp(rawBuffer)
    .resize({
      width: maxDimension,
      height: maxDimension,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      palette: false,
    })
    .toBuffer();

  const optimizedBase64 = optimized.toString("base64");
  logger.info(`Screenshot optimized PNG: ${optimized.length} bytes (${Math.round((1 - optimized.length / rawBuffer.length) * 100)}% reduction)`);

  return {
    content: [
      {
        type: "image" as const,
        data: optimizedBase64,
        mimeType: "image/png" as const,
      },
      {
        type: "text" as const,
        text: JSON.stringify({
          nodeId: result.nodeId,
          nodeName: result.nodeName,
          originalBytes: rawBuffer.length,
          optimizedBytes: optimized.length,
        }),
      },
    ],
  };
});
