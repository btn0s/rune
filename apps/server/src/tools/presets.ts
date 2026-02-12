import { z } from "zod";
import { registerTool } from "../mcp";
import { sendCommand } from "../bridge";
import { getPreset, listPresets } from "../presets";
import type { StylePreset } from "../presets";
import { parseColor } from "@workspace/shared/color";
import { logger } from "../logger";

// ─── list_style_presets ──────────────────────────────────────────────────────

registerTool("list_style_presets", {
  title: "List Style Presets",
  description:
    "List all available style presets with their roles. " +
    "Roles are semantic shortcuts (like CSS component classes) that map to token combos. " +
    "Use apply_preset with a role to style nodes, or pass role directly in create_frame/create_text.",
}, async () => {
  const names = listPresets();
  const result = names.map((name) => {
    const preset = getPreset(name)!;
    const roles = Object.entries(preset.roles).map(([roleName, def]) => ({
      role: roleName,
      description: def.description,
    }));
    return { name, description: preset.description, roles };
  });
  return { presets: result };
});

// ─── get_style_preset ────────────────────────────────────────────────────────

registerTool("get_style_preset", {
  title: "Get Style Preset",
  description:
    "Get the full token map for a named style preset. Returns all design tokens " +
    "(colors, type scale, spacing, radii, shadows, font) so you can reference them " +
    "when creating and styling nodes. Call this once at the start of a design task, " +
    "then use the returned hex values, sizes, and spacing values in your create/style calls.",
  inputSchema: {
    preset: z
      .string()
      .describe('Preset name (e.g. "ambrook-warm"). Use list_style_presets to see available names.'),
  },
}, async (args) => {
  const name = args.preset as string;
  const preset = getPreset(name);
  if (!preset) {
    const available = listPresets();
    throw new Error(
      `Unknown preset "${name}". Available presets: ${available.join(", ") || "(none)"}`,
    );
  }
  return preset;
});

// ─── get_style_preset_token ──────────────────────────────────────────────────

type TokenCategory = "colors" | "typeScale" | "spacing" | "radii" | "shadows";

function resolveToken(preset: StylePreset, token: string): Record<string, unknown> {
  const categories: TokenCategory[] = ["colors", "typeScale", "spacing", "radii", "shadows"];

  for (const category of categories) {
    const bucket = preset[category] as Record<string, unknown>;
    if (token in bucket) {
      const raw = bucket[token] as Record<string, unknown>;
      const result: Record<string, unknown> = { token, category, ...raw };

      if (category === "colors" && typeof raw.hex === "string") {
        result.rgba = parseColor(raw.hex);
      }

      if (category === "typeScale") {
        result.fontFamily = preset.font;
      }

      return result;
    }
  }

  const allTokens = categories.flatMap((c) => Object.keys(preset[c]));
  throw new Error(
    `Unknown token "${token}" in preset "${preset.name}". Available tokens: ${allTokens.join(", ")}`,
  );
}

function resolveRoleTokens(preset: StylePreset, role: string): string[] {
  const roleDef = preset.roles[role];
  if (!roleDef) {
    const available = Object.keys(preset.roles);
    throw new Error(
      `Unknown role "${role}" in preset "${preset.name}". Available roles: ${available.join(", ")}`,
    );
  }
  return roleDef.tokens;
}

registerTool("get_style_preset_token", {
  title: "Get Style Preset Token",
  description:
    "Resolve a single token from a style preset. Returns the token value with its " +
    "category and description. For color tokens, also returns the pre-parsed RGBA object " +
    "(0-1 range) ready for use in set_style/create_* fillColor/fontColor params. " +
    "For type tokens, includes fontFamily from the preset.",
  inputSchema: {
    preset: z
      .string()
      .describe('Preset name (e.g. "ambrook-warm")'),
    token: z
      .string()
      .describe('Token path (e.g. "text.primary", "type.body", "space.md", "radius.lg", "shadow.dropdown")'),
  },
}, async (args) => {
  const name = args.preset as string;
  const token = args.token as string;

  const preset = getPreset(name);
  if (!preset) {
    const available = listPresets();
    throw new Error(
      `Unknown preset "${name}". Available presets: ${available.join(", ") || "(none)"}`,
    );
  }

  return resolveToken(preset, token);
});

// ─── apply_preset ────────────────────────────────────────────────────────────

function buildStyleParams(
  preset: StylePreset,
  tokens: string[],
): { style: Record<string, unknown>; textStyle: Record<string, unknown> } {
  const style: Record<string, unknown> = {};
  const textStyle: Record<string, unknown> = {};

  for (const token of tokens) {
    const resolved = resolveToken(preset, token);

    switch (resolved.category) {
      case "colors": {
        const rgba = resolved.rgba as { r: number; g: number; b: number; a?: number };
        if (token.startsWith("text.")) {
          textStyle.fontColor = rgba;
        } else if (token.startsWith("border.")) {
          style.strokeColor = rgba;
          if (!style.strokeWeight) style.strokeWeight = 1;
        } else {
          style.fillColor = rgba;
        }
        break;
      }
      case "typeScale": {
        textStyle.fontSize = resolved.fontSize;
        textStyle.fontWeight = resolved.fontWeight;
        textStyle.fontFamily = resolved.fontFamily;
        break;
      }
      case "spacing":
        break;
      case "radii":
        style.cornerRadius = resolved.value;
        break;
      case "shadows":
        break;
    }
  }

  return { style, textStyle };
}

export async function applyPresetToNode(
  nodeId: string,
  presetName: string,
  tokens: string[],
  role?: string,
): Promise<Record<string, unknown>> {
  const preset = getPreset(presetName);
  if (!preset) {
    const available = listPresets();
    throw new Error(
      `Unknown preset "${presetName}". Available presets: ${available.join(", ") || "(none)"}`,
    );
  }

  const { style, textStyle } = buildStyleParams(preset, tokens);
  const applied: string[] = [];
  const manualTokens: Record<string, unknown>[] = [];

  if (Object.keys(style).length > 0) {
    await sendCommand("set_style", { nodeId, ...style });
    applied.push(...Object.keys(style));
  }

  if (Object.keys(textStyle).length > 0) {
    await sendCommand("set_text_style", { nodeId, ...textStyle });
    applied.push(...Object.keys(textStyle));
  }

  for (const token of tokens) {
    const resolved = resolveToken(preset, token);

    if (resolved.category === "shadows") {
      const shadow = resolved as {
        offsetX: number;
        offsetY: number;
        blurRadius: number;
        color: string;
      };
      const shadowColor = parseColor(shadow.color);
      await sendCommand("add_effect", {
        nodeId,
        type: "DROP_SHADOW",
        offsetX: shadow.offsetX,
        offsetY: shadow.offsetY,
        blurRadius: shadow.blurRadius,
        color: shadowColor,
      });
      applied.push("shadow");
    }

    if (resolved.category === "spacing") {
      manualTokens.push({ token, value: resolved.value, description: resolved.description });
    }
  }

  const metadata = {
    preset: presetName,
    ...(role ? { role } : {}),
    tokens,
    appliedAt: new Date().toISOString(),
  };
  await sendCommand("set_plugin_data", {
    nodeId,
    key: "rune:preset",
    value: JSON.stringify(metadata),
  });

  logger.info(`apply_preset: applied ${role ?? tokens.join(", ")} from "${presetName}" to ${nodeId}`);

  return {
    nodeId,
    preset: presetName,
    ...(role ? { role } : {}),
    tokensApplied: tokens,
    stylesSet: applied,
    ...(manualTokens.length > 0 ? { spacingTokens: manualTokens } : {}),
  };
}

registerTool("apply_preset", {
  title: "Apply Preset",
  description:
    "Apply a preset role or tokens to a node. Resolves styles, applies them, " +
    "and stamps metadata — all in one call.\n\n" +
    "**Preferred: use `role`** — semantic shortcuts like \"card\", \"title\", \"input\".\n" +
    "Roles map to predefined token combos (like CSS component classes).\n" +
    "Use `tokens` only for custom combos not covered by a role.\n\n" +
    "Examples:\n" +
    "- apply_preset(nodeId, preset=\"ambrook-warm\", role=\"card\")\n" +
    "- apply_preset(nodeId, preset=\"ambrook-warm\", role=\"title\")\n" +
    "- apply_preset(nodeId, preset=\"ambrook-warm\", tokens=[\"surface.selected\", \"radius.md\"])",
  inputSchema: {
    nodeId: z.string().describe("Target node ID"),
    preset: z
      .string()
      .describe('Preset name (e.g. "ambrook-warm")'),
    role: z
      .string()
      .optional()
      .describe('Semantic role (e.g. "card", "title", "input", "hint"). Preferred over tokens.'),
    tokens: z
      .array(z.string())
      .optional()
      .describe("Individual token names — use only if no role fits. Ignored when role is provided."),
  },
}, async (args) => {
  const nodeId = args.nodeId as string;
  const presetName = args.preset as string;
  const roleName = args.role as string | undefined;
  const rawTokens = args.tokens as string[] | undefined;

  if (!roleName && (!rawTokens || rawTokens.length === 0)) {
    throw new Error("Either `role` or `tokens` must be provided.");
  }

  const preset = getPreset(presetName);
  if (!preset) {
    const available = listPresets();
    throw new Error(
      `Unknown preset "${presetName}". Available presets: ${available.join(", ") || "(none)"}`,
    );
  }

  const tokens = roleName ? resolveRoleTokens(preset, roleName) : rawTokens!;
  return applyPresetToNode(nodeId, presetName, tokens, roleName);
});

// ─── get_node_preset_info ────────────────────────────────────────────────────

registerTool("get_node_preset_info", {
  title: "Get Node Preset Info",
  description:
    "Read back which style preset and tokens were applied to a node. " +
    "Returns null if the node has no preset metadata. " +
    "Useful for understanding what styles a node is using and ensuring consistency.",
  inputSchema: {
    nodeId: z.string().describe("Target node ID"),
  },
}, async (args) => {
  const nodeId = args.nodeId as string;
  const result = (await sendCommand("get_plugin_data", {
    nodeId,
    key: "rune:preset",
  })) as { value: string | null };

  if (!result.value) {
    return { nodeId, hasPreset: false };
  }

  try {
    const metadata = JSON.parse(result.value);
    return { nodeId, hasPreset: true, ...metadata };
  } catch {
    return { nodeId, hasPreset: false, rawValue: result.value };
  }
});
