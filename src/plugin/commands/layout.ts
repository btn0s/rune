import { commandRegistry } from "./registry";

// ─── Auto-Layout ──────────────────────────────────────────────────────────────

commandRegistry.set("set_auto_layout", async (params) => {
  const { nodeId, direction } = params;
  if (!nodeId) throw new Error("nodeId is required");
  if (!direction) throw new Error("direction is required");

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) throw new Error(`Node not found: ${nodeId}`);

  if (!("layoutMode" in node)) {
    throw new Error(`Node ${nodeId} (${node.type}) does not support auto-layout`);
  }

  const frame = node as FrameNode;

  if (direction === "NONE") {
    frame.layoutMode = "NONE";
    return { id: frame.id, name: frame.name, layoutMode: "NONE" };
  }

  frame.layoutMode = direction as "HORIZONTAL" | "VERTICAL";

  // Padding
  if (params.paddingTop !== undefined) frame.paddingTop = params.paddingTop;
  if (params.paddingRight !== undefined) frame.paddingRight = params.paddingRight;
  if (params.paddingBottom !== undefined) frame.paddingBottom = params.paddingBottom;
  if (params.paddingLeft !== undefined) frame.paddingLeft = params.paddingLeft;

  // Spacing
  if (params.itemSpacing !== undefined) frame.itemSpacing = params.itemSpacing;

  // Alignment
  if (params.primaryAxisAlignItems !== undefined) {
    frame.primaryAxisAlignItems = params.primaryAxisAlignItems;
  }
  if (params.counterAxisAlignItems !== undefined) {
    frame.counterAxisAlignItems = params.counterAxisAlignItems;
  }

  // Wrap
  if (params.layoutWrap !== undefined) {
    frame.layoutWrap = params.layoutWrap;
  }

  // Counter axis spacing (only relevant when wrap is enabled)
  if (params.counterAxisSpacing !== undefined) {
    frame.counterAxisSpacing = params.counterAxisSpacing;
  }

  return {
    id: frame.id,
    name: frame.name,
    layoutMode: frame.layoutMode,
    paddingTop: frame.paddingTop,
    paddingRight: frame.paddingRight,
    paddingBottom: frame.paddingBottom,
    paddingLeft: frame.paddingLeft,
    itemSpacing: frame.itemSpacing,
    primaryAxisAlignItems: frame.primaryAxisAlignItems,
    counterAxisAlignItems: frame.counterAxisAlignItems,
    layoutWrap: frame.layoutWrap,
  };
});

// ─── Layout Sizing ────────────────────────────────────────────────────────────

commandRegistry.set("set_layout_sizing", async (params) => {
  const { nodeId, horizontal, vertical } = params;
  if (!nodeId) throw new Error("nodeId is required");

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) throw new Error(`Node not found: ${nodeId}`);

  if (!("layoutSizingHorizontal" in node)) {
    throw new Error(`Node ${nodeId} (${node.type}) does not support layout sizing`);
  }

  const target = node as FrameNode;

  if (horizontal !== undefined) {
    target.layoutSizingHorizontal = horizontal;
  }
  if (vertical !== undefined) {
    target.layoutSizingVertical = vertical;
  }

  return {
    id: target.id,
    name: target.name,
    layoutSizingHorizontal: target.layoutSizingHorizontal,
    layoutSizingVertical: target.layoutSizingVertical,
  };
});

// ─── Layout Align (child within auto-layout parent) ──────────────────────────

commandRegistry.set("set_layout_align", async (params) => {
  const { nodeId, layoutAlign, layoutGrow } = params;
  if (!nodeId) throw new Error("nodeId is required");

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) throw new Error(`Node not found: ${nodeId}`);

  if (!("layoutAlign" in node)) {
    throw new Error(`Node ${nodeId} (${node.type}) does not support layoutAlign`);
  }

  const child = node as SceneNode & { layoutAlign: string; layoutGrow: number };

  if (layoutAlign !== undefined) {
    child.layoutAlign = layoutAlign;
  }
  if (layoutGrow !== undefined) {
    child.layoutGrow = layoutGrow;
  }

  return {
    id: child.id,
    name: child.name,
    layoutAlign: child.layoutAlign,
    layoutGrow: child.layoutGrow,
  };
});

// ─── Move Node ────────────────────────────────────────────────────────────────

commandRegistry.set("move_node", async (params) => {
  const { nodeId, x, y } = params;
  if (!nodeId) throw new Error("nodeId is required");
  if (x === undefined || y === undefined) throw new Error("x and y are required");

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) throw new Error(`Node not found: ${nodeId}`);

  if (!("x" in node) || !("y" in node)) {
    throw new Error(`Node ${nodeId} (${node.type}) does not support positioning`);
  }

  const target = node as SceneNode;
  (target as any).x = x;
  (target as any).y = y;

  return {
    id: target.id,
    name: target.name,
    x: (target as any).x,
    y: (target as any).y,
  };
});

// ─── Resize Node ──────────────────────────────────────────────────────────────

commandRegistry.set("resize_node", async (params) => {
  const { nodeId, width, height } = params;
  if (!nodeId) throw new Error("nodeId is required");
  if (width === undefined || height === undefined) {
    throw new Error("width and height are required");
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) throw new Error(`Node not found: ${nodeId}`);

  if (!("resize" in node)) {
    throw new Error(`Node ${nodeId} (${node.type}) does not support resizing`);
  }

  const target = node as SceneNode & { resize: (w: number, h: number) => void };
  target.resize(width, height);

  return {
    id: target.id,
    name: target.name,
    width: (target as any).width,
    height: (target as any).height,
  };
});

// ─── Set Rotation ─────────────────────────────────────────────────────────────

commandRegistry.set("set_rotation", async (params) => {
  const { nodeId, rotation } = params;
  if (!nodeId) throw new Error("nodeId is required");
  if (rotation === undefined) throw new Error("rotation is required");

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) throw new Error(`Node not found: ${nodeId}`);

  if (!("rotation" in node)) {
    throw new Error(`Node ${nodeId} (${node.type}) does not support rotation`);
  }

  const target = node as SceneNode;
  (target as any).rotation = rotation;

  return {
    id: target.id,
    name: target.name,
    rotation: (target as any).rotation,
  };
});
