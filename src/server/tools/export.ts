import { z } from "zod";
import { registerTool } from "../mcp";
import { sendCommand } from "../bridge";

const EXPORT_TIMEOUT_MS = 60_000;

registerTool("export_node_as_image", {
  title: "Export Node as Image",
  description:
    "Export a node as an image. Returns base64-encoded image data with the corresponding MIME type. Supports PNG, JPG, SVG, and PDF formats.",
  inputSchema: {
    nodeId: z.string().describe("The ID of the node to export"),
    format: z
      .enum(["PNG", "JPG", "SVG", "PDF"])
      .default("PNG")
      .describe("Export format (default: PNG)"),
    scale: z
      .number()
      .positive()
      .default(1)
      .describe("Export scale multiplier (default: 1)"),
  },
}, async (args) => {
  const result = await sendCommand("export_node_as_image", args, EXPORT_TIMEOUT_MS) as {
    imageData: string;
    mimeType: string;
    format: string;
    size: number;
  };

  return {
    imageData: result.imageData,
    mimeType: result.mimeType,
    format: result.format,
    size: result.size,
  };
});
