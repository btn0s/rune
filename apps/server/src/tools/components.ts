import { registerTool } from "../mcp";
import { sendCommand } from "../bridge";

registerTool("get_local_components", {
  title: "Get Local Components",
  description:
    "List all local components in the Figma document. Returns each component's id, name, key, and description.",
}, async () => {
  return await sendCommand("get_local_components");
});
