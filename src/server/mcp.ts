import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ZodRawShapeCompat } from "@modelcontextprotocol/sdk/server/zod-compat.js";
import { logger } from "./logger";

const VERSION = "1.0.0";

export const mcpServer = new McpServer({
  name: "rune",
  version: VERSION,
});

export function registerTool<Args extends ZodRawShapeCompat>(
  name: string,
  config: {
    title?: string;
    description?: string;
    inputSchema?: Args;
  },
  handler: (args: Record<string, unknown>) => Promise<unknown>,
): void {
  const wrappedHandler = async (
    args: Record<string, unknown>,
  ): Promise<CallToolResult> => {
    try {
      const result = await handler(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);
      logger.error(`Tool "${name}" failed: ${message}`);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${message}`,
          },
        ],
        isError: true,
      };
    }
  };

  if (config.inputSchema) {
    mcpServer.registerTool(name, {
      title: config.title,
      description: config.description,
      inputSchema: config.inputSchema,
    }, wrappedHandler as any);
  } else {
    mcpServer.registerTool(name, {
      title: config.title,
      description: config.description,
    }, wrappedHandler as any);
  }

  logger.debug(`Registered tool: ${name}`);
}

export async function startMcpServer(): Promise<void> {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  logger.info("MCP server started");
}
