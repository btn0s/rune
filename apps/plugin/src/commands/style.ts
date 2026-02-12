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

function makeSolidPaint(color: { r: number; g: number; b: number; a?: number }): SolidPaint {
  return {
    type: "SOLID",
    color: { r: color.r, g: color.g, b: color.b },
    opacity: color.a ?? 1,
  };
}

// ─── set_style ───────────────────────────────────────────────────────────────

commandRegistry.set("set_style", async (params) => {
  const { nodeId, fillColor, strokeColor, strokeWeight, strokeAlign, cornerRadius, opacity, visible, gradientFill } = params;
  const node = await getSceneNode(nodeId);

  // Fill
  if (fillColor !== undefined && "fills" in node) {
    const geom = node as GeometryMixin;
    if (fillColor === null) {
      geom.fills = [];
    } else {
      geom.fills = [makeSolidPaint(fillColor)];
    }
  }

  // Gradient fill
  if (gradientFill !== undefined && "fills" in node) {
    const geom = node as GeometryMixin;
    const stops: readonly ColorStop[] = gradientFill.stops.map((s: { position: number; color: { r: number; g: number; b: number; a?: number } }) => ({
      position: s.position,
      color: { r: s.color.r, g: s.color.g, b: s.color.b, a: s.color.a ?? 1 },
    }));
    const defaultTransform: Transform = [[1, 0, 0], [0, 1, 0]];
    const transform: Transform = gradientFill.transform
      ? [gradientFill.transform[0] as [number, number, number], gradientFill.transform[1] as [number, number, number]]
      : defaultTransform;
    const gradient: GradientPaint = {
      type: gradientFill.type,
      gradientStops: stops,
      gradientTransform: transform,
    };
    geom.fills = [gradient];
  }

  // Stroke
  if (strokeColor !== undefined && "strokes" in node) {
    const geom = node as GeometryMixin;
    if (strokeColor === null) {
      geom.strokes = [];
    } else {
      geom.strokes = [makeSolidPaint(strokeColor)];
    }
  }

  if (strokeWeight !== undefined && "strokeWeight" in node) {
    (node as any).strokeWeight = strokeWeight;
  }

  if (strokeAlign !== undefined && "strokeAlign" in node) {
    (node as any).strokeAlign = strokeAlign;
  }

  // Corner radius
  if (cornerRadius !== undefined && "cornerRadius" in node) {
    if (typeof cornerRadius === "number") {
      (node as any).cornerRadius = cornerRadius;
    } else if (typeof cornerRadius === "object" && cornerRadius !== null) {
      const rectNode = node as RectangleNode;
      rectNode.topLeftRadius = cornerRadius.topLeft ?? 0;
      rectNode.topRightRadius = cornerRadius.topRight ?? 0;
      rectNode.bottomRightRadius = cornerRadius.bottomRight ?? 0;
      rectNode.bottomLeftRadius = cornerRadius.bottomLeft ?? 0;
    }
  }

  // Opacity
  if (opacity !== undefined && "opacity" in node) {
    (node as BlendMixin).opacity = opacity;
  }

  // Visibility
  if (visible !== undefined) {
    node.visible = visible;
  }

  return { id: node.id, name: node.name };
});

// ─── add_effect ──────────────────────────────────────────────────────────────

commandRegistry.set("add_effect", async (params) => {
  const { nodeId, type, color, offsetX, offsetY, blurRadius, spread } = params;
  const node = await getSceneNode(nodeId);

  if (!("effects" in node)) {
    throw new Error(`Node ${nodeId} does not support effects`);
  }

  const blendNode = node as BlendMixin;

  if (type === "DROP_SHADOW" || type === "INNER_SHADOW") {
    const shadow = {
      type: type as "DROP_SHADOW" | "INNER_SHADOW",
      color: {
        r: color?.r ?? 0,
        g: color?.g ?? 0,
        b: color?.b ?? 0,
        a: color?.a ?? 0.25,
      },
      offset: { x: offsetX ?? 0, y: offsetY ?? 4 },
      radius: blurRadius ?? 4,
      spread: spread ?? 0,
      visible: true,
      blendMode: "NORMAL" as const,
    };
    blendNode.effects = [...blendNode.effects, shadow];
  } else if (type === "LAYER_BLUR" || type === "BACKGROUND_BLUR") {
    const blur: BlurEffectNormal = {
      type: type as "LAYER_BLUR" | "BACKGROUND_BLUR",
      blurType: "NORMAL",
      radius: blurRadius ?? 4,
      visible: true,
    };
    blendNode.effects = [...blendNode.effects, blur];
  } else {
    throw new Error(`Unsupported effect type: ${type}`);
  }

  return { id: node.id, name: node.name, effectCount: blendNode.effects.length };
});

// ─── remove_effects ──────────────────────────────────────────────────────────

commandRegistry.set("remove_effects", async (params) => {
  const { nodeId } = params;
  const node = await getSceneNode(nodeId);

  if (!("effects" in node)) {
    throw new Error(`Node ${nodeId} does not support effects`);
  }

  const blendNode = node as BlendMixin;
  const previousCount = blendNode.effects.length;
  blendNode.effects = [];

  return { id: node.id, name: node.name, removedCount: previousCount };
});

// ─── get_node_style ──────────────────────────────────────────────────────────

commandRegistry.set("get_node_style", async (params) => {
  const { nodeId } = params;
  const node = await getSceneNode(nodeId);

  const result: Record<string, any> = {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible,
    locked: node.locked,
  };

  if ("fills" in node && Array.isArray(node.fills)) {
    result.fills = (node.fills as readonly Paint[]).map((fill) => {
      const f = { ...fill } as Record<string, any>;
      delete f.boundVariables;
      delete f.imageRef;
      return f;
    });
  }

  if ("strokes" in node && Array.isArray(node.strokes)) {
    result.strokes = (node.strokes as readonly Paint[]).map((stroke) => {
      const s = { ...stroke } as Record<string, any>;
      delete s.boundVariables;
      return s;
    });
    if ("strokeWeight" in node) result.strokeWeight = (node as any).strokeWeight;
    if ("strokeAlign" in node) result.strokeAlign = (node as any).strokeAlign;
  }

  if ("cornerRadius" in node) {
    result.cornerRadius = (node as any).cornerRadius;
  }
  if ("topLeftRadius" in node) {
    result.cornerRadii = {
      topLeft: (node as any).topLeftRadius,
      topRight: (node as any).topRightRadius,
      bottomRight: (node as any).bottomRightRadius,
      bottomLeft: (node as any).bottomLeftRadius,
    };
  }

  if ("opacity" in node) {
    result.opacity = (node as BlendMixin).opacity;
  }

  if ("blendMode" in node) {
    result.blendMode = (node as BlendMixin).blendMode;
  }

  if ("effects" in node) {
    const blendNode = node as BlendMixin;
    result.effects = blendNode.effects.map((effect) => {
      const e = { ...effect } as Record<string, any>;
      delete e.boundVariables;
      return e;
    });
  }

  return result;
});

// ─── set_locked ──────────────────────────────────────────────────────────────

commandRegistry.set("set_locked", async (params) => {
  const { nodeId, locked } = params;
  if (locked === undefined) throw new Error("locked is required");
  const node = await getSceneNode(nodeId);
  node.locked = locked;
  return { id: node.id, name: node.name, locked: node.locked };
});

// ─── set_image_fill ──────────────────────────────────────────────────────────

commandRegistry.set("set_image_fill", async (params) => {
  const { nodeId, base64, scaleMode = "FILL" } = params;
  if (!nodeId) throw new Error("nodeId is required");
  if (!base64) throw new Error("base64 image data is required");

  const node = await getSceneNode(nodeId);
  if (!("fills" in node)) {
    throw new Error(`Node ${nodeId} does not support fills`);
  }

  const bytes = figma.base64Decode(base64);
  const image = figma.createImage(bytes);

  const paint: ImagePaint = {
    type: "IMAGE",
    scaleMode: scaleMode,
    imageHash: image.hash,
  };

  (node as GeometryMixin).fills = [paint];

  return { id: node.id, name: node.name, imageHash: image.hash };
});
