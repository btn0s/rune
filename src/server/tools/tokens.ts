import { z } from "zod";
import { registerTool } from "../mcp";
import { sendCommand } from "../bridge";

// ─── snapshot_design_tokens ──────────────────────────────────────────────────

registerTool("snapshot_design_tokens", {
  title: "Snapshot Design Tokens",
  description:
    "Extract implicit design system tokens from a selection of nodes. " +
    "Analyzes the visual properties across the specified nodes and returns " +
    "deduplicated design tokens: colors, type scale (font sizes/weights/families), " +
    "spacing values, corner radii, and effects. " +
    "Useful for understanding the visual style of existing wireframes before creating new ones.",
  inputSchema: {
    nodeIds: z
      .array(z.string())
      .min(1)
      .describe("IDs of nodes to analyze (typically top-level frames)"),
    maxDepth: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe("How deep to recurse into children (default: 10, 0 = root nodes only)"),
  },
}, async (args) => {
  return await sendCommand("snapshot_design_tokens", args, 60_000);
});
