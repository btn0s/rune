import { z } from "zod";
import { registerTool } from "../mcp";
import { sendCommand } from "../bridge";
import { parseColor } from "@workspace/shared/color";

const fontColorSchema = z
  .union([
    z.string(),
    z.object({
      r: z.number().min(0).max(1),
      g: z.number().min(0).max(1),
      b: z.number().min(0).max(1),
      a: z.number().min(0).max(1).optional(),
    }),
  ])
  .describe('Text color as hex string ("#FF0000") or RGBA object ({r, g, b, a?} in 0-1 range)');

// ─── set_text_content ─────────────────────────────────────────────────────────

registerTool("set_text_content", {
  title: "Set Text Content",
  description:
    "Replace the text content of a text node. Loads the current font automatically before modifying text.",
  inputSchema: {
    nodeId: z.string().describe("The ID of the text node"),
    text: z.string().describe("New text content"),
  },
}, async (args) => {
  return sendCommand("set_text_content", args);
});

// ─── set_text_style ───────────────────────────────────────────────────────────

registerTool("set_text_style", {
  title: "Set Text Style",
  description:
    "Set styling properties on a text node. All style properties are optional — only provided values are changed. Loads fonts automatically.",
  inputSchema: {
    nodeId: z.string().describe("The ID of the text node"),
    fontFamily: z.string().optional().describe("Font family (e.g. Inter, Roboto)"),
    fontSize: z.number().positive().optional().describe("Font size in pixels"),
    fontWeight: z
      .number()
      .min(100)
      .max(900)
      .optional()
      .describe("Font weight (100=Thin, 400=Regular, 700=Bold, 900=Black)"),
    fontColor: fontColorSchema.optional(),
    textAlignHorizontal: z
      .enum(["LEFT", "CENTER", "RIGHT", "JUSTIFIED"])
      .optional()
      .describe("Horizontal text alignment"),
    textAlignVertical: z
      .enum(["TOP", "CENTER", "BOTTOM"])
      .optional()
      .describe("Vertical text alignment"),
    textAutoResize: z
      .enum(["NONE", "WIDTH_AND_HEIGHT", "HEIGHT", "TRUNCATE"])
      .optional()
      .describe("How the text node auto-resizes"),
    textDecoration: z
      .enum(["NONE", "UNDERLINE", "STRIKETHROUGH"])
      .optional()
      .describe("Text decoration"),
    letterSpacing: z.number().optional().describe("Letter spacing as percentage (e.g. 10 = 10%)"),
    lineHeight: z.union([z.number().positive(), z.literal("AUTO")]).optional().describe("Line height in pixels, or 'AUTO'"),
  },
}, async (args) => {
  const params = { ...args } as Record<string, unknown>;

  if (params.fontColor !== undefined) {
    params.fontColor = parseColor(params.fontColor as string | { r: number; g: number; b: number; a?: number });
  }

  return sendCommand("set_text_style", params);
});

// ─── get_text_content ─────────────────────────────────────────────────────────

registerTool("get_text_content", {
  title: "Get Text Content",
  description:
    "Get the text content and current style information of a text node.",
  inputSchema: {
    nodeId: z.string().describe("The ID of the text node"),
  },
}, async (args) => {
  return sendCommand("get_text_content", args);
});
