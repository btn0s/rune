import { z } from "zod";
import { registerTool } from "../mcp";
import { listConnections, getActiveFile, setActiveFile } from "../bridge";

registerTool("list_connections", {
  title: "List Plugin Connections",
  description:
    "List all connected Figma plugin instances. Each connection represents an open Figma file with the Rune plugin running. Shows which file is currently active (receives commands).",
}, async () => {
  const conns = listConnections();
  if (conns.length === 0) {
    return { connections: [], message: "No Figma plugins are connected." };
  }
  return { connections: conns };
});

registerTool("get_active_file", {
  title: "Get Active File",
  description:
    "Get the currently active Figma file that receives commands. When multiple plugins are connected, only the active file receives tool commands.",
}, async () => {
  const active = getActiveFile();
  if (!active) {
    return { active: null, message: "No Figma plugins are connected." };
  }
  return active;
});

registerTool("set_active_file", {
  title: "Set Active File",
  description:
    "Switch the active Figma file by fileKey. All subsequent tool commands will be routed to this file's plugin. Use list_connections to see available fileKeys.",
  inputSchema: {
    fileKey: z.string().describe("The fileKey of the connection to make active. Get this from list_connections."),
  },
}, async (args) => {
  return setActiveFile(args.fileKey as string);
});
