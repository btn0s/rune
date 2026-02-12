import { commandRegistry } from "./registry";

commandRegistry.set("set_plugin_data", async (params) => {
  const { nodeId, key, value } = params;
  if (!nodeId) throw new Error("nodeId is required");
  if (!key) throw new Error("key is required");

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) throw new Error(`Node not found: ${nodeId}`);

  node.setPluginData(key, value ?? "");
  return { nodeId, key, value: value ?? "" };
});

commandRegistry.set("get_plugin_data", async (params) => {
  const { nodeId, key } = params;
  if (!nodeId) throw new Error("nodeId is required");
  if (!key) throw new Error("key is required");

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) throw new Error(`Node not found: ${nodeId}`);

  const value = node.getPluginData(key);
  return { nodeId, key, value: value || null };
});

commandRegistry.set("get_all_plugin_data", async (params) => {
  const { nodeId } = params;
  if (!nodeId) throw new Error("nodeId is required");

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) throw new Error(`Node not found: ${nodeId}`);

  const keys = node.getPluginDataKeys();
  const data: Record<string, string> = {};
  for (const key of keys) {
    data[key] = node.getPluginData(key);
  }

  return { nodeId, data };
});
