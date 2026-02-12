import { commandRegistry } from "./registry";

async function getSceneNode(nodeId: string): Promise<SceneNode> {
  if (!nodeId) throw new Error("nodeId is required");
  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) throw new Error(`Node not found: ${nodeId}`);
  if (node.type === "DOCUMENT" || node.type === "PAGE") {
    throw new Error(`Cannot style a ${node.type} node`);
  }
  return node as SceneNode;
}

const ALL_STYLE_PROPERTIES = [
  "fills",
  "strokes",
  "effects",
  "cornerRadius",
  "opacity",
  "strokeWeight",
  "strokeAlign",
] as const;

commandRegistry.set("copy_style_from_node", async (params) => {
  const { sourceNodeId, targetNodeIds, properties } = params;
  if (!sourceNodeId) throw new Error("sourceNodeId is required");
  if (!targetNodeIds || !Array.isArray(targetNodeIds) || targetNodeIds.length === 0) {
    throw new Error("targetNodeIds must be a non-empty array");
  }

  const source = await getSceneNode(sourceNodeId);
  const propsToCopy: readonly string[] = properties && properties.length > 0 ? properties : ALL_STYLE_PROPERTIES;

  const results: Array<{ id: string; name: string; copiedProperties: string[] }> = [];

  for (const targetId of targetNodeIds) {
    const target = await getSceneNode(targetId);
    const copied: string[] = [];

    for (const prop of propsToCopy) {
      switch (prop) {
        case "fills":
          if ("fills" in source && "fills" in target) {
            (target as GeometryMixin).fills = JSON.parse(JSON.stringify((source as GeometryMixin).fills));
            copied.push("fills");
          }
          break;
        case "strokes":
          if ("strokes" in source && "strokes" in target) {
            (target as GeometryMixin).strokes = JSON.parse(JSON.stringify((source as GeometryMixin).strokes));
            copied.push("strokes");
          }
          break;
        case "effects":
          if ("effects" in source && "effects" in target) {
            (target as BlendMixin).effects = JSON.parse(JSON.stringify((source as BlendMixin).effects));
            copied.push("effects");
          }
          break;
        case "cornerRadius":
          if ("cornerRadius" in source && "cornerRadius" in target) {
            const srcRadius = (source as any).cornerRadius;
            if (srcRadius === figma.mixed) {
              if ("topLeftRadius" in source && "topLeftRadius" in target) {
                (target as any).topLeftRadius = (source as any).topLeftRadius;
                (target as any).topRightRadius = (source as any).topRightRadius;
                (target as any).bottomRightRadius = (source as any).bottomRightRadius;
                (target as any).bottomLeftRadius = (source as any).bottomLeftRadius;
              }
            } else {
              (target as any).cornerRadius = srcRadius;
            }
            copied.push("cornerRadius");
          }
          break;
        case "opacity":
          if ("opacity" in source && "opacity" in target) {
            (target as BlendMixin).opacity = (source as BlendMixin).opacity;
            copied.push("opacity");
          }
          break;
        case "strokeWeight":
          if ("strokeWeight" in source && "strokeWeight" in target) {
            (target as any).strokeWeight = (source as any).strokeWeight;
            copied.push("strokeWeight");
          }
          break;
        case "strokeAlign":
          if ("strokeAlign" in source && "strokeAlign" in target) {
            (target as any).strokeAlign = (source as any).strokeAlign;
            copied.push("strokeAlign");
          }
          break;
      }
    }

    results.push({ id: target.id, name: target.name, copiedProperties: copied });
  }

  return { source: { id: source.id, name: source.name }, targets: results };
});

commandRegistry.set("get_node_computed_styles", async (params) => {
  const { nodeId, includeLayout, includeText } = params;
  const node = await getSceneNode(nodeId);

  const styles: Record<string, any> = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  if ("fills" in node && Array.isArray(node.fills)) {
    styles.fills = (node.fills as readonly Paint[]).map((f) => {
      const fill = { ...f } as Record<string, any>;
      delete fill.boundVariables;
      delete fill.imageRef;
      return fill;
    });
  }

  if ("strokes" in node && Array.isArray(node.strokes)) {
    styles.strokes = (node.strokes as readonly Paint[]).map((s) => {
      const stroke = { ...s } as Record<string, any>;
      delete stroke.boundVariables;
      return stroke;
    });
    if ("strokeWeight" in node) styles.strokeWeight = (node as any).strokeWeight;
    if ("strokeAlign" in node) styles.strokeAlign = (node as any).strokeAlign;
  }

  if ("cornerRadius" in node) {
    const radius = (node as any).cornerRadius;
    if (radius === figma.mixed) {
      styles.cornerRadius = "mixed";
      if ("topLeftRadius" in node) {
        styles.cornerRadii = {
          topLeft: (node as any).topLeftRadius,
          topRight: (node as any).topRightRadius,
          bottomRight: (node as any).bottomRightRadius,
          bottomLeft: (node as any).bottomLeftRadius,
        };
      }
    } else {
      styles.cornerRadius = radius;
    }
  }

  if ("opacity" in node) {
    styles.opacity = (node as BlendMixin).opacity;
  }

  if ("blendMode" in node) {
    styles.blendMode = (node as BlendMixin).blendMode;
  }

  if ("effects" in node) {
    styles.effects = (node as BlendMixin).effects.map((e) => {
      const effect = { ...e } as Record<string, any>;
      delete effect.boundVariables;
      return effect;
    });
  }

  styles.visible = node.visible;
  styles.locked = node.locked;

  if (includeLayout && "layoutMode" in node) {
    const frame = node as FrameNode;
    styles.layout = {
      layoutMode: frame.layoutMode,
      layoutWrap: frame.layoutWrap,
      paddingTop: frame.paddingTop,
      paddingRight: frame.paddingRight,
      paddingBottom: frame.paddingBottom,
      paddingLeft: frame.paddingLeft,
      itemSpacing: frame.itemSpacing,
      primaryAxisAlignItems: frame.primaryAxisAlignItems,
      counterAxisAlignItems: frame.counterAxisAlignItems,
      layoutSizingHorizontal: frame.layoutSizingHorizontal,
      layoutSizingVertical: frame.layoutSizingVertical,
    };
  }

  if (node.type === "VECTOR") {
    const vectorNode = node as VectorNode;
    if (vectorNode.vectorPaths && vectorNode.vectorPaths.length > 0) {
      styles.vectorPaths = vectorNode.vectorPaths.map((vp: VectorPath) => ({
        windingRule: vp.windingRule,
        data: vp.data,
      }));
    }
  }

  const shouldIncludeText = includeText !== undefined ? includeText : node.type === "TEXT";
  if (shouldIncludeText && node.type === "TEXT") {
    const textNode = node as TextNode;
    styles.text = {
      characters: textNode.characters,
      fontSize: textNode.fontSize,
      fontName: textNode.fontName,
      textAlignHorizontal: textNode.textAlignHorizontal,
      textAlignVertical: textNode.textAlignVertical,
      textAutoResize: textNode.textAutoResize,
      textDecoration: textNode.textDecoration,
      lineHeight: textNode.lineHeight,
      letterSpacing: textNode.letterSpacing,
    };
  }

  return styles;
});
