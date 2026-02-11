import { commandRegistry } from "./registry";

function fontWeightToStyle(weight: number): string[] {
  const map: Record<number, string[]> = {
    100: ["Thin"],
    200: ["Extra Light", "ExtraLight", "UltraLight", "Ultralight"],
    300: ["Light"],
    400: ["Regular"],
    500: ["Medium"],
    600: ["Semibold", "SemiBold", "Semi Bold", "DemiBold"],
    700: ["Bold"],
    800: ["Extra Bold", "ExtraBold", "Ultra Bold", "UltraBold", "Heavy"],
    900: ["Black"],
  };
  return map[weight] ?? ["Regular"];
}

function applyFill(
  node: GeometryMixin,
  color?: { r: number; g: number; b: number; a?: number },
): void {
  if (!color) {
    node.fills = [];
    return;
  }
  const paint: SolidPaint = {
    type: "SOLID",
    color: { r: color.r, g: color.g, b: color.b },
    opacity: color.a ?? 1,
  };
  node.fills = [paint];
}

function applyStroke(
  node: GeometryMixin,
  color?: { r: number; g: number; b: number; a?: number },
  weight?: number,
): void {
  if (!color) return;
  const paint: SolidPaint = {
    type: "SOLID",
    color: { r: color.r, g: color.g, b: color.b },
    opacity: color.a ?? 1,
  };
  node.strokes = [paint];
  if (weight !== undefined) (node as any).strokeWeight = weight;
}

interface NodeDef {
  type: "FRAME" | "RECTANGLE" | "ELLIPSE" | "TEXT" | "LINE" | "VECTOR";
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fillColor?: { r: number; g: number; b: number; a?: number };
  strokeColor?: { r: number; g: number; b: number; a?: number };
  strokeWeight?: number;
  strokeAlign?: "INSIDE" | "OUTSIDE" | "CENTER";
  cornerRadius?: number;
  opacity?: number;
  layoutMode?: "NONE" | "HORIZONTAL" | "VERTICAL";
  layoutWrap?: "NO_WRAP" | "WRAP";
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  itemSpacing?: number;
  primaryAxisAlignItems?: "MIN" | "MAX" | "CENTER" | "SPACE_BETWEEN";
  counterAxisAlignItems?: "MIN" | "MAX" | "CENTER" | "BASELINE";
  layoutSizingHorizontal?: "FIXED" | "HUG" | "FILL";
  layoutSizingVertical?: "FIXED" | "HUG" | "FILL";
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  fontColor?: { r: number; g: number; b: number; a?: number };
  textAlignHorizontal?: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
  letterSpacing?: number;
  lineHeight?: number | "AUTO";
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  svgPath?: string;
  children?: NodeDef[];
}

interface CreatedNodeResult {
  id: string;
  name: string;
  type: string;
  children?: CreatedNodeResult[];
}

async function createNodeFromDef(
  def: NodeDef,
  parent: BaseNode & ChildrenMixin,
): Promise<CreatedNodeResult> {
  let node: SceneNode;

  switch (def.type) {
    case "FRAME": {
      const frame = figma.createFrame();
      frame.resize(def.width ?? 100, def.height ?? 100);
      frame.name = def.name ?? "Frame";
      applyFill(frame, def.fillColor);
      applyStroke(frame, def.strokeColor, def.strokeWeight);
      if (def.strokeAlign) (frame as any).strokeAlign = def.strokeAlign;
      if (def.cornerRadius !== undefined) frame.cornerRadius = def.cornerRadius;

      if (def.layoutMode && def.layoutMode !== "NONE") {
        frame.layoutMode = def.layoutMode;
        if (def.layoutWrap) frame.layoutWrap = def.layoutWrap;
        if (def.paddingTop !== undefined) frame.paddingTop = def.paddingTop;
        if (def.paddingRight !== undefined) frame.paddingRight = def.paddingRight;
        if (def.paddingBottom !== undefined) frame.paddingBottom = def.paddingBottom;
        if (def.paddingLeft !== undefined) frame.paddingLeft = def.paddingLeft;
        if (def.itemSpacing !== undefined) frame.itemSpacing = def.itemSpacing;
        if (def.primaryAxisAlignItems) frame.primaryAxisAlignItems = def.primaryAxisAlignItems;
        if (def.counterAxisAlignItems) frame.counterAxisAlignItems = def.counterAxisAlignItems;
      }

      node = frame;
      break;
    }
    case "RECTANGLE": {
      const rect = figma.createRectangle();
      rect.resize(def.width ?? 100, def.height ?? 100);
      rect.name = def.name ?? "Rectangle";
      applyFill(rect, def.fillColor);
      applyStroke(rect, def.strokeColor, def.strokeWeight);
      if (def.strokeAlign) (rect as any).strokeAlign = def.strokeAlign;
      if (def.cornerRadius !== undefined) rect.cornerRadius = def.cornerRadius;
      node = rect;
      break;
    }
    case "ELLIPSE": {
      const ellipse = figma.createEllipse();
      ellipse.resize(def.width ?? 100, def.height ?? 100);
      ellipse.name = def.name ?? "Ellipse";
      applyFill(ellipse, def.fillColor);
      applyStroke(ellipse, def.strokeColor, def.strokeWeight);
      if (def.strokeAlign) (ellipse as any).strokeAlign = def.strokeAlign;
      node = ellipse;
      break;
    }
    case "TEXT": {
      const family = def.fontFamily ?? "Inter";
      const styleVariants = fontWeightToStyle(def.fontWeight ?? 400);
      let loadedStyle = styleVariants[0];
      for (const variant of styleVariants) {
        try {
          await figma.loadFontAsync({ family, style: variant });
          loadedStyle = variant;
          break;
        } catch {
          continue;
        }
      }

      const textNode = figma.createText();
      textNode.fontName = { family, style: loadedStyle };
      textNode.fontSize = def.fontSize ?? 14;
      textNode.characters = def.text ?? "";
      textNode.name = def.name ?? "Text";

      if (def.fontColor) {
        const paint: SolidPaint = {
          type: "SOLID",
          color: { r: def.fontColor.r, g: def.fontColor.g, b: def.fontColor.b },
          opacity: def.fontColor.a ?? 1,
        };
        textNode.fills = [paint];
      }

      if (def.textAlignHorizontal) {
        textNode.textAlignHorizontal = def.textAlignHorizontal;
      }

      if (def.letterSpacing !== undefined) {
        textNode.letterSpacing = { value: def.letterSpacing, unit: "PERCENT" };
      }

      if (def.lineHeight !== undefined) {
        textNode.lineHeight = def.lineHeight === "AUTO"
          ? { unit: "AUTO" }
          : { value: def.lineHeight, unit: "PIXELS" };
      }

      node = textNode;
      break;
    }
    case "LINE": {
      const line = figma.createLine();
      const sx = def.startX ?? 0;
      const sy = def.startY ?? 0;
      const ex = def.endX ?? 100;
      const ey = def.endY ?? 0;
      line.x = sx;
      line.y = sy;
      const dx = ex - sx;
      const dy = ey - sy;
      const length = Math.sqrt(dx * dx + dy * dy);
      line.resize(length, 0);
      line.rotation = -Math.atan2(dy, dx) * (180 / Math.PI);
      line.name = def.name ?? "Line";
      const strokeCol = def.strokeColor ?? { r: 0, g: 0, b: 0 };
      applyStroke(line as any, strokeCol, def.strokeWeight ?? 1);
      node = line;
      break;
    }
    case "VECTOR": {
      const vector = figma.createVector();
      vector.name = def.name ?? "Vector";
      if (def.svgPath) {
        vector.vectorPaths = [{
          windingRule: "NONZERO",
          data: def.svgPath,
        }];
      }
      if (def.width && def.height) vector.resize(def.width, def.height);
      applyFill(vector, def.fillColor);
      applyStroke(vector, def.strokeColor, def.strokeWeight);
      if (def.strokeAlign) (vector as any).strokeAlign = def.strokeAlign;
      node = vector;
      break;
    }
    default:
      throw new Error(`Unsupported node type: ${(def as any).type}`);
  }

  if (def.x !== undefined) node.x = def.x;
  if (def.y !== undefined) node.y = def.y;
  if (def.opacity !== undefined && "opacity" in node) {
    (node as BlendMixin).opacity = def.opacity;
  }

  parent.appendChild(node);

  if (def.layoutSizingHorizontal && "layoutSizingHorizontal" in node) {
    (node as any).layoutSizingHorizontal = def.layoutSizingHorizontal;
  }
  if (def.layoutSizingVertical && "layoutSizingVertical" in node) {
    (node as any).layoutSizingVertical = def.layoutSizingVertical;
  }

  const result: CreatedNodeResult = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  if (def.children && def.children.length > 0 && "children" in node) {
    const childParent = node as BaseNode & ChildrenMixin;
    result.children = [];
    for (const childDef of def.children) {
      const childResult = await createNodeFromDef(childDef, childParent);
      result.children.push(childResult);
    }
  }

  return result;
}

commandRegistry.set("create_nodes_batch", async (params) => {
  const { parentId, nodes } = params;
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    throw new Error("nodes array is required and must not be empty");
  }

  let parent: BaseNode & ChildrenMixin;
  if (parentId) {
    const parentNode = await figma.getNodeByIdAsync(parentId);
    if (!parentNode) throw new Error(`Parent node not found: ${parentId}`);
    if (!("appendChild" in parentNode)) throw new Error(`Node ${parentId} cannot have children`);
    parent = parentNode as BaseNode & ChildrenMixin;
  } else {
    parent = figma.currentPage;
  }

  const created: CreatedNodeResult[] = [];
  for (const nodeDef of nodes) {
    const result = await createNodeFromDef(nodeDef as NodeDef, parent);
    created.push(result);
  }

  return { created, count: created.length };
});
