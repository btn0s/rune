import { commandRegistry } from "./index";

function fontWeightToStyle(weight: number): string {
  const map: Record<number, string> = {
    100: "Thin",
    200: "Extra Light",
    300: "Light",
    400: "Regular",
    500: "Medium",
    600: "Semi Bold",
    700: "Bold",
    800: "Extra Bold",
    900: "Black",
  };
  return map[weight] ?? "Regular";
}

function getTextNode(nodeId: string): TextNode {
  if (!nodeId) throw new Error("nodeId is required");
  const node = figma.getNodeById(nodeId);
  if (!node) throw new Error(`Node not found: ${nodeId}`);
  if (node.type !== "TEXT") throw new Error(`Node ${nodeId} is not a TEXT node (got ${node.type})`);
  return node as TextNode;
}

async function safeLoadFont(family: string, style: string): Promise<void> {
  try {
    await figma.loadFontAsync({ family, style });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to load font "${family} ${style}": ${msg}`);
  }
}

// Handles figma.mixed (multiple fonts in one node) by loading the first character's font
async function loadCurrentFont(textNode: TextNode): Promise<{ family: string; style: string }> {
  const fontName = textNode.fontName;

  if (fontName === figma.mixed) {
    if (textNode.characters.length > 0) {
      const firstFont = textNode.getRangeFontName(0, 1) as FontName;
      await safeLoadFont(firstFont.family, firstFont.style);
      return { family: firstFont.family, style: firstFont.style };
    }
    await safeLoadFont("Inter", "Regular");
    return { family: "Inter", style: "Regular" };
  }

  await safeLoadFont(fontName.family, fontName.style);
  return { family: fontName.family, style: fontName.style };
}

// ─── set_text_content ─────────────────────────────────────────────────────────

commandRegistry.set("set_text_content", async (params) => {
  const { nodeId, text } = params;
  if (text === undefined || text === null) throw new Error("text is required");

  const textNode = getTextNode(nodeId);

  // CRITICAL: Load current font before modifying text
  await loadCurrentFont(textNode);

  textNode.characters = String(text);

  return {
    id: textNode.id,
    name: textNode.name,
    characters: textNode.characters,
  };
});

// ─── set_text_style ───────────────────────────────────────────────────────────

commandRegistry.set("set_text_style", async (params) => {
  const {
    nodeId,
    fontFamily,
    fontSize,
    fontWeight,
    fontColor,
    textAlignHorizontal,
    textAlignVertical,
    textAutoResize,
    textDecoration,
  } = params;

  const textNode = getTextNode(nodeId);

  // CRITICAL: font must be loaded before any text property changes
  const currentFont = await loadCurrentFont(textNode);

  const newFamily = fontFamily ?? currentFont.family;
  const newStyle = fontWeight !== undefined ? fontWeightToStyle(fontWeight) : currentFont.style;

  if (newFamily !== currentFont.family || newStyle !== currentFont.style) {
    await safeLoadFont(newFamily, newStyle);
    textNode.fontName = { family: newFamily, style: newStyle };
  }

  if (fontSize !== undefined) {
    textNode.fontSize = fontSize;
  }

  if (fontColor) {
    const paint: SolidPaint = {
      type: "SOLID",
      color: { r: fontColor.r, g: fontColor.g, b: fontColor.b },
      opacity: fontColor.a ?? 1,
    };
    textNode.fills = [paint];
  }

  if (textAlignHorizontal) {
    textNode.textAlignHorizontal = textAlignHorizontal;
  }
  if (textAlignVertical) {
    textNode.textAlignVertical = textAlignVertical;
  }

  if (textAutoResize) {
    textNode.textAutoResize = textAutoResize;
  }

  if (textDecoration) {
    textNode.textDecoration = textDecoration;
  }

  return {
    id: textNode.id,
    name: textNode.name,
    fontName: textNode.fontName,
    fontSize: textNode.fontSize,
    textAlignHorizontal: textNode.textAlignHorizontal,
    textAlignVertical: textNode.textAlignVertical,
    textAutoResize: textNode.textAutoResize,
    textDecoration: textNode.textDecoration,
  };
});

// ─── get_text_content ─────────────────────────────────────────────────────────

commandRegistry.set("get_text_content", async (params) => {
  const { nodeId } = params;
  const textNode = getTextNode(nodeId);

  const fontName = textNode.fontName;
  const fontSize = textNode.fontSize;

  const style: Record<string, any> = {
    textAlignHorizontal: textNode.textAlignHorizontal,
    textAlignVertical: textNode.textAlignVertical,
    textAutoResize: textNode.textAutoResize,
    textDecoration: textNode.textDecoration,
  };

  if (fontName === figma.mixed) {
    style.fontName = "mixed";
  } else {
    style.fontFamily = fontName.family;
    style.fontStyle = fontName.style;
  }

  if (fontSize === figma.mixed) {
    style.fontSize = "mixed";
  } else {
    style.fontSize = fontSize;
  }

  const fills = textNode.fills;
  if (fills !== figma.mixed && Array.isArray(fills) && fills.length > 0) {
    const first = fills[0];
    if (first.type === "SOLID") {
      style.color = {
        r: first.color.r,
        g: first.color.g,
        b: first.color.b,
        a: first.opacity ?? 1,
      };
    }
  }

  return {
    id: textNode.id,
    name: textNode.name,
    characters: textNode.characters,
    style,
  };
});
