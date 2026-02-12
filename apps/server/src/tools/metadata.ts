import { z } from "zod";
import { registerTool } from "../mcp";
import { sendCommand } from "../bridge";

// ─── set_plugin_data ─────────────────────────────────────────────────────────

registerTool("set_plugin_data", {
  title: "Set Plugin Data",
  description:
    "Store a key-value string on a node as plugin-scoped metadata. " +
    "Data persists with the file and is only visible to this plugin. " +
    "Useful for tagging nodes with semantic roles, preset names, or other annotations.",
  inputSchema: {
    nodeId: z.string().describe("Target node ID"),
    key: z.string().describe("Metadata key"),
    value: z.string().describe("Metadata value (string)"),
  },
}, async (args) => {
  return await sendCommand("set_plugin_data", args);
});

// ─── get_plugin_data ─────────────────────────────────────────────────────────

registerTool("get_plugin_data", {
  title: "Get Plugin Data",
  description:
    "Read a single plugin-scoped metadata value from a node by key. " +
    "Returns null if the key has not been set.",
  inputSchema: {
    nodeId: z.string().describe("Target node ID"),
    key: z.string().describe("Metadata key to read"),
  },
}, async (args) => {
  return await sendCommand("get_plugin_data", args);
});

// ─── get_all_plugin_data ─────────────────────────────────────────────────────

registerTool("get_all_plugin_data", {
  title: "Get All Plugin Data",
  description:
    "Read all plugin-scoped metadata from a node. Returns a key-value map of all stored data.",
  inputSchema: {
    nodeId: z.string().describe("Target node ID"),
  },
}, async (args) => {
  return await sendCommand("get_all_plugin_data", args);
});
