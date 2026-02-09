import { commandRegistry } from "./index";

// ─── Delete Node ──────────────────────────────────────────────────────────────

commandRegistry.set("delete_node", async (params) => {
  const { nodeId, nodeIds } = params;

  // Support both single nodeId and nodeIds array
  const idsToDelete: string[] = [];

  if (nodeIds && Array.isArray(nodeIds)) {
    idsToDelete.push(...nodeIds);
  } else if (nodeId) {
    idsToDelete.push(nodeId);
  } else {
    throw new Error("Either nodeId or nodeIds is required");
  }

  const deleted: string[] = [];
  const errors: Array<{ id: string; error: string }> = [];

  for (const id of idsToDelete) {
    const node = figma.getNodeById(id);
    if (!node) {
      errors.push({ id, error: `Node not found: ${id}` });
      continue;
    }
    if (node.type === "DOCUMENT" || node.type === "PAGE") {
      errors.push({ id, error: `Cannot delete ${node.type} node` });
      continue;
    }

    const name = node.name;
    (node as SceneNode).remove();
    deleted.push(id);
  }

  return {
    deleted,
    deletedCount: deleted.length,
    errors: errors.length > 0 ? errors : undefined,
  };
});

// ─── Clone Node ───────────────────────────────────────────────────────────────

commandRegistry.set("clone_node", async (params) => {
  const { nodeId, x, y } = params;
  if (!nodeId) throw new Error("nodeId is required");

  const node = figma.getNodeById(nodeId);
  if (!node) throw new Error(`Node not found: ${nodeId}`);
  if (node.type === "DOCUMENT" || node.type === "PAGE") {
    throw new Error(`Cannot clone ${node.type} node`);
  }

  const clone = (node as SceneNode).clone();

  if (x !== undefined) clone.x = x;
  if (y !== undefined) clone.y = y;

  return {
    id: clone.id,
    name: clone.name,
    type: clone.type,
    x: clone.x,
    y: clone.y,
  };
});

// ─── Rename Node ──────────────────────────────────────────────────────────────

commandRegistry.set("rename_node", async (params) => {
  const { nodeId, name } = params;
  if (!nodeId) throw new Error("nodeId is required");
  if (!name) throw new Error("name is required");

  const node = figma.getNodeById(nodeId);
  if (!node) throw new Error(`Node not found: ${nodeId}`);
  if (node.type === "DOCUMENT") {
    throw new Error("Cannot rename DOCUMENT node");
  }

  const oldName = node.name;
  node.name = name;

  return {
    id: node.id,
    oldName,
    newName: node.name,
    type: node.type,
  };
});

// ─── Reparent Node ────────────────────────────────────────────────────────────

commandRegistry.set("reparent_node", async (params) => {
  const { nodeId, newParentId, index } = params;
  if (!nodeId) throw new Error("nodeId is required");
  if (!newParentId) throw new Error("newParentId is required");

  const node = figma.getNodeById(nodeId);
  if (!node) throw new Error(`Node not found: ${nodeId}`);
  if (node.type === "DOCUMENT" || node.type === "PAGE") {
    throw new Error(`Cannot reparent ${node.type} node`);
  }

  const newParent = figma.getNodeById(newParentId);
  if (!newParent) throw new Error(`Parent node not found: ${newParentId}`);
  if (!("children" in newParent)) {
    throw new Error(`Target parent (${newParent.type}) cannot have children`);
  }

  const parentNode = newParent as ChildrenMixin & BaseNode;
  const sceneNode = node as SceneNode;

  if (index !== undefined && index >= 0) {
    parentNode.insertChild(index, sceneNode);
  } else {
    parentNode.appendChild(sceneNode);
  }

  return {
    id: sceneNode.id,
    name: sceneNode.name,
    newParent: { id: parentNode.id, name: parentNode.name },
    index: index !== undefined ? index : parentNode.children.length - 1,
  };
});
