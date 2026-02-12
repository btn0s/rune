import { z } from "zod";
import { registerTool } from "../mcp";
import { sendCommand } from "../bridge";

// ─── get_available_fonts ─────────────────────────────────────────────────────

registerTool("get_available_fonts", {
  title: "Get Available Fonts",
  description:
    "Query available font families and their styles/weights that can be loaded in the current Figma document. " +
    "Optionally filter by family name. Useful for discovering which fonts are available " +
    "before creating text nodes, avoiding font loading errors.",
  inputSchema: {
    family: z
      .string()
      .optional()
      .describe("Filter by font family name (case-insensitive, partial match)"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(500)
      .optional()
      .describe("Maximum number of font families to return (default: 50)"),
  },
}, async (args) => {
  return await sendCommand("get_available_fonts", args);
});
