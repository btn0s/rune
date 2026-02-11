/**
 * Minimal MCP server repro for OpenCode tool-result crash.
 *
 * Registers a single "echo" tool that returns a standard CallToolResult.
 * If this fails with the same `TypeError: undefined is not an object
 * (evaluating 'output.output.toLowerCase')` then the bug is in OpenCode's
 * processor.ts, not in Rune.
 *
 * Usage:
 *   bun /Users/btn0s/figma/rune/repro/server.ts
 *
 * Or register in opencode.json:
 *   "mcp-repro": { "type": "local", "command": ["bun", "/Users/btn0s/figma/rune/repro/server.ts"] }
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "mcp-repro",
  version: "0.0.1",
});

// Simplest possible tool — takes a message, returns it back
server.registerTool(
  "echo",
  {
    title: "Echo",
    description: "Echoes back the provided message. Minimal repro tool.",
    inputSchema: {
      message: z.string().describe("The message to echo back"),
    },
  },
  async ({ message }) => {
    return {
      content: [
        {
          type: "text" as const,
          text: `Echo: ${message}`,
        },
      ],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[mcp-repro] Server started on stdio");
}

main().catch((err) => {
  console.error(`[mcp-repro] Fatal: ${err}`);
  process.exit(1);
});
