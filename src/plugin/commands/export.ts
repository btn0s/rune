import { commandRegistry } from "./registry";

// ─── Export Node as Image ─────────────────────────────────────────────────────

commandRegistry.set("export_node_as_image", async (params) => {
  const { nodeId, format = "PNG", scale = 1 } = params;
  if (!nodeId) throw new Error("nodeId is required");

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) throw new Error(`Node not found: ${nodeId}`);
  if (node.type === "DOCUMENT" || node.type === "PAGE") {
    throw new Error(`Cannot export ${node.type} node as image`);
  }

  const exportNode = node as SceneNode & ExportMixin;

  const settings: ExportSettings = format === "SVG"
    ? { format: "SVG" }
    : format === "PDF"
      ? { format: "PDF" }
      : format === "JPG"
        ? { format: "JPG", constraint: { type: "SCALE", value: scale } }
        : { format: "PNG", constraint: { type: "SCALE", value: scale } };

  const bytes = await exportNode.exportAsync(settings);

  // Convert Uint8Array to base64
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const imageData = btoa(binary);

  const mimeTypes: Record<string, string> = {
    PNG: "image/png",
    JPG: "image/jpeg",
    SVG: "image/svg+xml",
    PDF: "application/pdf",
  };

  return {
    imageData,
    mimeType: mimeTypes[format] || "image/png",
    format,
    size: bytes.length,
  };
});
