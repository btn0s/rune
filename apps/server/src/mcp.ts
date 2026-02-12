import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ZodRawShapeCompat } from "@modelcontextprotocol/sdk/server/zod-compat.js";
import { logger } from "./logger";

const VERSION = "1.0.0";
const DEFAULT_HTTP_PORT = 3056;

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
    logger.info(`Tool "${name}" called with args: ${JSON.stringify(args)}`);
    try {
      const result = await handler(args);
      const text = JSON.stringify(result);
      logger.info(`Tool "${name}" result type: ${typeof result}, text length: ${text?.length}, text preview: ${text?.slice(0, 200)}`);
      const response: CallToolResult = {
        content: [
          {
            type: "text" as const,
            text: text,
          },
        ],
      };
      logger.info(`Tool "${name}" response: ${JSON.stringify(response).slice(0, 300)}`);
      return response;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);
      logger.error(`Tool "${name}" failed: ${message}`);
      return {
        content: [
          {
            type: "text" as const,
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

export function registerRawTool<Args extends ZodRawShapeCompat>(
  name: string,
  config: {
    title?: string;
    description?: string;
    inputSchema?: Args;
  },
  handler: (args: Record<string, unknown>) => Promise<CallToolResult>,
): void {
  const wrappedHandler = async (
    args: Record<string, unknown>,
  ): Promise<CallToolResult> => {
    logger.info(`Tool "${name}" called with args: ${JSON.stringify(args)}`);
    try {
      const result = await handler(args);
      logger.info(`Tool "${name}" returned ${result.content.length} content block(s)`);
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);
      logger.error(`Tool "${name}" failed: ${message}`);
      return {
        content: [
          {
            type: "text" as const,
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

  logger.debug(`Registered raw tool: ${name}`);
}

export async function startMcpServer(): Promise<void> {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  logger.info("MCP server started (stdio)");
}

export async function startHttpMcpServer(port?: number): Promise<void> {
  const httpPort = port ?? DEFAULT_HTTP_PORT;

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });

  await mcpServer.connect(transport);

  Bun.serve({
    port: httpPort,
    async fetch(req: Request): Promise<Response> {
      const url = new URL(req.url);

      if (req.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, mcp-session-id, mcp-protocol-version",
          },
        });
      }

      if (url.pathname === "/mcp") {
        const response = await transport.handleRequest(req);
        response.headers.set("Access-Control-Allow-Origin", "*");
        response.headers.set("Access-Control-Expose-Headers", "mcp-session-id");
        return response;
      }

      if (url.pathname === "/health") {
        return new Response(JSON.stringify({ status: "ok" }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  logger.info(`MCP HTTP server listening on http://localhost:${httpPort}/mcp`);
}
