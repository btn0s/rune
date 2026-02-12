import { commandRegistry } from "./registry";

interface DesignTokens {
  colors: Array<{ hex: string; rgba: { r: number; g: number; b: number; a: number }; usage: string; count: number }>;
  typeScale: Array<{ fontSize: number; fontFamily: string; fontStyle: string; count: number }>;
  spacing: Array<{ value: number; usage: string; count: number }>;
  cornerRadii: Array<{ value: number; count: number }>;
  effects: Array<{ type: string; properties: Record<string, any>; count: number }>;
}

function rgbaToHex(r: number, g: number, b: number, a: number): string {
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  return a < 1 ? `${hex}${toHex(a)}` : hex;
}

function addColor(
  colors: Map<string, { rgba: { r: number; g: number; b: number; a: number }; usage: string; count: number }>,
  r: number, g: number, b: number, a: number,
  usage: string,
): void {
  const hex = rgbaToHex(r, g, b, a);
  const existing = colors.get(hex);
  if (existing) {
    existing.count++;
  } else {
    colors.set(hex, { rgba: { r, g, b, a }, usage, count: 1 });
  }
}

function addValue(map: Map<number, { usage: string; count: number }>, value: number, usage: string): void {
  const rounded = Math.round(value * 100) / 100;
  const existing = map.get(rounded);
  if (existing) {
    existing.count++;
  } else {
    map.set(rounded, { usage, count: 1 });
  }
}

function extractTokensFromNode(
  node: BaseNode,
  colors: Map<string, { rgba: { r: number; g: number; b: number; a: number }; usage: string; count: number }>,
  typeScale: Map<string, { fontSize: number; fontFamily: string; fontStyle: string; count: number }>,
  spacing: Map<number, { usage: string; count: number }>,
  cornerRadii: Map<number, { usage: string; count: number }>,
  effects: Map<string, { type: string; properties: Record<string, any>; count: number }>,
  maxDepth: number,
  currentDepth: number,
): void {
  if (currentDepth > maxDepth) return;
  if (node.type === "DOCUMENT" || node.type === "PAGE") return;

  const sceneNode = node as SceneNode;

  if ("fills" in sceneNode && Array.isArray(sceneNode.fills)) {
    for (const fill of sceneNode.fills as readonly Paint[]) {
      if (fill.type === "SOLID") {
        const solid = fill as SolidPaint;
        addColor(colors, solid.color.r, solid.color.g, solid.color.b, solid.opacity ?? 1, "fill");
      }
    }
  }

  if ("strokes" in sceneNode && Array.isArray(sceneNode.strokes)) {
    for (const stroke of sceneNode.strokes as readonly Paint[]) {
      if (stroke.type === "SOLID") {
        const solid = stroke as SolidPaint;
        addColor(colors, solid.color.r, solid.color.g, solid.color.b, solid.opacity ?? 1, "stroke");
      }
    }
  }

  if (sceneNode.type === "TEXT") {
    const textNode = sceneNode as TextNode;
    const fontSize = textNode.fontSize;
    const fontName = textNode.fontName;
    if (typeof fontSize === "number" && typeof fontName === "object" && "family" in fontName) {
      const key = `${fontName.family}|${fontName.style}|${fontSize}`;
      const existing = typeScale.get(key);
      if (existing) {
        existing.count++;
      } else {
        typeScale.set(key, {
          fontSize,
          fontFamily: fontName.family,
          fontStyle: fontName.style,
          count: 1,
        });
      }
    }
  }

  if ("layoutMode" in sceneNode) {
    const frame = sceneNode as FrameNode;
    if (frame.layoutMode !== "NONE") {
      if (frame.itemSpacing > 0) addValue(spacing, frame.itemSpacing, "itemSpacing");
      if (frame.paddingTop > 0) addValue(spacing, frame.paddingTop, "padding");
      if (frame.paddingRight > 0) addValue(spacing, frame.paddingRight, "padding");
      if (frame.paddingBottom > 0) addValue(spacing, frame.paddingBottom, "padding");
      if (frame.paddingLeft > 0) addValue(spacing, frame.paddingLeft, "padding");
    }
  }

  if ("cornerRadius" in sceneNode) {
    const radius = (sceneNode as any).cornerRadius;
    if (typeof radius === "number" && radius > 0) {
      const existing = cornerRadii.get(radius);
      if (existing) {
        existing.count++;
      } else {
        cornerRadii.set(radius, { usage: "cornerRadius", count: 1 });
      }
    }
  }

  if ("effects" in sceneNode) {
    for (const effect of (sceneNode as BlendMixin).effects) {
      if (effect.visible) {
        const key = JSON.stringify({ type: effect.type });
        const existing = effects.get(key);
        if (existing) {
          existing.count++;
        } else {
          const props: Record<string, any> = { type: effect.type };
          if ("offset" in effect) props.offset = (effect as any).offset;
          if ("radius" in effect) props.radius = (effect as any).radius;
          if ("spread" in effect) props.spread = (effect as any).spread;
          if ("color" in effect) props.color = (effect as any).color;
          effects.set(key, { type: effect.type, properties: props, count: 1 });
        }
      }
    }
  }

  if ("children" in sceneNode) {
    const children = (sceneNode as ChildrenMixin & BaseNode).children as readonly SceneNode[];
    for (const child of children) {
      extractTokensFromNode(child, colors, typeScale, spacing, cornerRadii, effects, maxDepth, currentDepth + 1);
    }
  }
}

commandRegistry.set("snapshot_design_tokens", async (params) => {
  const { nodeIds, maxDepth } = params;
  if (!nodeIds || !Array.isArray(nodeIds) || nodeIds.length === 0) {
    throw new Error("nodeIds array is required and must not be empty");
  }

  const depth = maxDepth ?? 10;
  const colors = new Map<string, { rgba: { r: number; g: number; b: number; a: number }; usage: string; count: number }>();
  const typeScale = new Map<string, { fontSize: number; fontFamily: string; fontStyle: string; count: number }>();
  const spacing = new Map<number, { usage: string; count: number }>();
  const cornerRadii = new Map<number, { usage: string; count: number }>();
  const effects = new Map<string, { type: string; properties: Record<string, any>; count: number }>();

  for (const id of nodeIds) {
    const node = await figma.getNodeByIdAsync(id);
    if (!node) throw new Error(`Node not found: ${id}`);
    extractTokensFromNode(node, colors, typeScale, spacing, cornerRadii, effects, depth, 0);
  }

  const sortByCount = (a: { count: number }, b: { count: number }) => b.count - a.count;

  const tokens: DesignTokens = {
    colors: Array.from(colors.entries())
      .map(([hex, data]) => ({ hex, ...data }))
      .sort(sortByCount),
    typeScale: Array.from(typeScale.values()).sort(sortByCount),
    spacing: Array.from(spacing.entries())
      .map(([value, data]) => ({ value, ...data }))
      .sort((a, b) => a.value - b.value),
    cornerRadii: Array.from(cornerRadii.entries())
      .map(([value, data]) => ({ value, ...data }))
      .sort((a, b) => a.value - b.value),
    effects: Array.from(effects.values()).sort(sortByCount),
  };

  return {
    analyzedNodes: nodeIds.length,
    maxDepth: depth,
    tokens,
  };
});
