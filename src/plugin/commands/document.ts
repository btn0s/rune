import { commandRegistry } from "./index";

/**
 * Filter a Figma node to remove token-bloating properties.
 * Strips vectorPaths, imageRef, and boundVariables recursively.
 */
function filterNodeProperties(node: SceneNode): Record<string, any> {
  const result: Record<string, any> = {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible,
    locked: node.locked,
  };

  // Bounds
  if ("absoluteBoundingBox" in node && node.absoluteBoundingBox) {
    result.bounds = {
      x: node.absoluteBoundingBox.x,
      y: node.absoluteBoundingBox.y,
      width: node.absoluteBoundingBox.width,
      height: node.absoluteBoundingBox.height,
    };
  } else if ("x" in node && "y" in node && "width" in node && "height" in node) {
    result.bounds = {
      x: (node as any).x,
      y: (node as any).y,
      width: (node as any).width,
      height: (node as any).height,
    };
  }

  // Fills — strip boundVariables and imageRef
  if ("fills" in node && Array.isArray(node.fills)) {
    result.fills = (node.fills as readonly Paint[]).map((fill) => {
      const f = { ...fill } as Record<string, any>;
      delete f.boundVariables;
      delete f.imageRef;
      return f;
    });
  }

  // Strokes — strip boundVariables
  if ("strokes" in node && Array.isArray(node.strokes)) {
    result.strokes = (node.strokes as readonly Paint[]).map((stroke) => {
      const s = { ...stroke } as Record<string, any>;
      delete s.boundVariables;
      return s;
    });
  }

  // Corner radius
  if ("cornerRadius" in node) {
    result.cornerRadius = (node as any).cornerRadius;
  }

  // Text content
  if (node.type === "TEXT") {
    result.characters = (node as TextNode).characters;
    result.fontSize = (node as TextNode).fontSize;
    result.fontName = (node as TextNode).fontName;
  }

  // Layout properties
  if ("layoutMode" in node) {
    result.layoutMode = (node as any).layoutMode;
  }

  // Opacity
  if ("opacity" in node) {
    result.opacity = (node as any).opacity;
  }

  // Parent info (id and name only)
  if (node.parent && node.parent.type !== "DOCUMENT") {
    result.parent = { id: node.parent.id, name: node.parent.name };
  }

  // Children summary (id, name, type only — no recursion)
  if ("children" in node) {
    const children = (node as ChildrenMixin & BaseNode).children as readonly SceneNode[];
    result.childCount = children.length;
    result.children = children.map((child) => ({
      id: child.id,
      name: child.name,
      type: child.type,
    }));
  }

  return result;
}

/**
 * Filter node for list contexts (lighter than full node info).
 */
function filterNodeSummary(node: SceneNode): Record<string, any> {
  const result: Record<string, any> = {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible,
  };

  if ("x" in node && "y" in node && "width" in node && "height" in node) {
    result.bounds = {
      x: (node as any).x,
      y: (node as any).y,
      width: (node as any).width,
      height: (node as any).height,
    };
  }

  return result;
}

// ─── Document Info ───────────────────────────────────────────────────────────

commandRegistry.set("get_document_info", async () => {
  const doc = figma.root;
  return {
    name: doc.name,
    currentPage: {
      id: figma.currentPage.id,
      name: figma.currentPage.name,
    },
    pages: doc.children.map((page) => ({
      id: page.id,
      name: page.name,
      childCount: page.children.length,
    })),
  };
});

// ─── Page Navigation ─────────────────────────────────────────────────────────

commandRegistry.set("set_current_page", async (params) => {
  const { pageNameOrId } = params;
  if (!pageNameOrId) throw new Error("pageNameOrId is required");

  const page = figma.root.children.find(
    (p) => p.id === pageNameOrId || p.name === pageNameOrId,
  );
  if (!page) throw new Error(`Page not found: ${pageNameOrId}`);

  await figma.setCurrentPageAsync(page);
  return { id: page.id, name: page.name };
});

commandRegistry.set("create_page", async (params) => {
  const { name } = params;
  if (!name) throw new Error("name is required");

  const page = figma.createPage();
  page.name = name;
  return { id: page.id, name: page.name };
});

// ─── Node Navigation ─────────────────────────────────────────────────────────

commandRegistry.set("get_node_by_id", async (params) => {
  const { nodeId } = params;
  if (!nodeId) throw new Error("nodeId is required");

  const node = figma.getNodeById(nodeId);
  if (!node) throw new Error(`Node not found: ${nodeId}`);

  if (node.type === "DOCUMENT" || node.type === "PAGE") {
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      ...("children" in node
        ? {
            childCount: (node as any).children.length,
            children: (node as any).children.map((c: any) => ({
              id: c.id,
              name: c.name,
              type: c.type,
            })),
          }
        : {}),
    };
  }

  return filterNodeProperties(node as SceneNode);
});

commandRegistry.set("get_node_children", async (params) => {
  const { nodeId, offset = 0, limit = 50 } = params;
  if (!nodeId) throw new Error("nodeId is required");

  const node = figma.getNodeById(nodeId);
  if (!node) throw new Error(`Node not found: ${nodeId}`);
  if (!("children" in node)) throw new Error(`Node ${nodeId} has no children`);

  const parent = node as ChildrenMixin & BaseNode;
  const children = parent.children as readonly SceneNode[];
  const total = children.length;
  const sliced = children.slice(offset, offset + limit);

  return {
    parentId: node.id,
    parentName: node.name,
    total,
    offset,
    limit,
    count: sliced.length,
    hasMore: offset + limit < total,
    children: sliced.map(filterNodeSummary),
  };
});

commandRegistry.set("find_nodes", async (params) => {
  const { name, type } = params;
  if (!name && !type) throw new Error("At least one of 'name' or 'type' is required");

  let results: SceneNode[];

  if (type && !name) {
    // Type-only search using findAllWithCriteria
    results = figma.currentPage.findAllWithCriteria({
      types: [type as NodeType],
    });
  } else {
    // Name search (with optional type filter)
    results = figma.currentPage.findAll((node) => {
      const nameMatch = name
        ? node.name.toLowerCase().includes((name as string).toLowerCase())
        : true;
      const typeMatch = type ? node.type === type : true;
      return nameMatch && typeMatch;
    });
  }

  return {
    count: results.length,
    nodes: results.slice(0, 100).map(filterNodeSummary),
    truncated: results.length > 100,
  };
});

// ─── Selection ───────────────────────────────────────────────────────────────

commandRegistry.set("get_selection", async () => {
  const selection = figma.currentPage.selection;
  return {
    count: selection.length,
    nodes: selection.map(filterNodeSummary),
  };
});

commandRegistry.set("set_selection", async (params) => {
  const { nodeIds } = params;
  if (!nodeIds || !Array.isArray(nodeIds)) throw new Error("nodeIds array is required");

  const nodes: SceneNode[] = [];
  for (const id of nodeIds) {
    const node = figma.getNodeById(id);
    if (node && node.type !== "DOCUMENT" && node.type !== "PAGE") {
      nodes.push(node as SceneNode);
    }
  }

  figma.currentPage.selection = nodes;
  return {
    count: nodes.length,
    nodes: nodes.map((n) => ({ id: n.id, name: n.name, type: n.type })),
  };
});

// ─── Viewport ────────────────────────────────────────────────────────────────

commandRegistry.set("get_viewport", async () => {
  return {
    center: figma.viewport.center,
    zoom: figma.viewport.zoom,
    bounds: figma.viewport.bounds,
  };
});

commandRegistry.set("set_viewport", async (params) => {
  const { x, y, zoom } = params;
  if (x === undefined || y === undefined) throw new Error("x and y are required");

  figma.viewport.center = { x, y };
  if (zoom !== undefined) {
    figma.viewport.zoom = zoom;
  }

  return {
    center: figma.viewport.center,
    zoom: figma.viewport.zoom,
  };
});

commandRegistry.set("zoom_to_fit", async (params) => {
  const { nodeIds } = params;

  let nodes: SceneNode[] = [];

  if (nodeIds && Array.isArray(nodeIds) && nodeIds.length > 0) {
    for (const id of nodeIds) {
      const node = figma.getNodeById(id);
      if (node && node.type !== "DOCUMENT" && node.type !== "PAGE") {
        nodes.push(node as SceneNode);
      }
    }
  } else {
    nodes = [...figma.currentPage.selection];
  }

  if (nodes.length === 0) {
    throw new Error("No nodes to zoom to. Provide nodeIds or select nodes first.");
  }

  figma.viewport.scrollAndZoomIntoView(nodes);

  return {
    center: figma.viewport.center,
    zoom: figma.viewport.zoom,
    nodeCount: nodes.length,
  };
});
