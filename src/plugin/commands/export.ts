import { commandRegistry } from "./registry";

// ─── Export PNG ───────────────────────────────────────────────────────────────

commandRegistry.set("export_png", async (params) => {
  const { nodeId, scale = 1 } = params;

  let node: SceneNode;

  if (nodeId) {
    const found = await figma.getNodeByIdAsync(nodeId);
    if (!found) throw new Error(`Node not found: ${nodeId}`);
    if (found.type === "DOCUMENT" || found.type === "PAGE") {
      throw new Error(`Cannot export a ${found.type} node. Provide a specific node ID.`);
    }
    node = found as SceneNode;
  } else {
    const sel = figma.currentPage.selection;
    if (sel.length === 0) {
      throw new Error("No nodeId provided and nothing is selected. Provide a nodeId or select a node.");
    }
    node = sel[0];
  }

  const bytes = await node.exportAsync({
    format: "PNG",
    constraint: { type: "SCALE", value: scale },
  });

  const base64 = figma.base64Encode(bytes);

  return {
    base64,
    width: ("width" in node) ? (node as any).width * scale : undefined,
    height: ("height" in node) ? (node as any).height * scale : undefined,
    nodeId: node.id,
    nodeName: node.name,
  };
});
