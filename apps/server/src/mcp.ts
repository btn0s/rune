import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import {
  isInitializeRequest,
  JSONRPCMessageSchema,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import type { ZodRawShapeCompat } from "@modelcontextprotocol/sdk/server/zod-compat.js";
import { logger } from "./logger";

const VERSION = "1.0.0";
const DEFAULT_HTTP_PORT = 3056;
type HttpTransport = WebStandardStreamableHTTPServerTransport;
type ServerRegistrar = (server: McpServer) => void;

const toolRegistrars: ServerRegistrar[] = [];
const promptRegistrars: ServerRegistrar[] = [];

function createServerInstance(): McpServer {
  const server = new McpServer({
    name: "rune",
    version: VERSION,
  });

  for (const register of toolRegistrars) {
    register(server);
  }

  for (const register of promptRegistrars) {
    register(server);
  }

  return server;
}

export const mcpServer = createServerInstance();

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
      logger.info(
        `Tool "${name}" result type: ${typeof result}, text length: ${text?.length}, text preview: ${text?.slice(0, 200)}`,
      );
      const response: CallToolResult = {
        content: [
          {
            type: "text" as const,
            text: text,
          },
        ],
      };
      logger.info(
        `Tool "${name}" response: ${JSON.stringify(response).slice(0, 300)}`,
      );
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
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

  const register = (server: McpServer) => {
    if (config.inputSchema) {
      server.registerTool(
        name,
        {
          title: config.title,
          description: config.description,
          inputSchema: config.inputSchema,
        },
        wrappedHandler as any,
      );
    } else {
      server.registerTool(
        name,
        {
          title: config.title,
          description: config.description,
        },
        wrappedHandler as any,
      );
    }
  };

  toolRegistrars.push(register);
  register(mcpServer);

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
      logger.info(
        `Tool "${name}" returned ${result.content.length} content block(s)`,
      );
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
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

  const register = (server: McpServer) => {
    if (config.inputSchema) {
      server.registerTool(
        name,
        {
          title: config.title,
          description: config.description,
          inputSchema: config.inputSchema,
        },
        wrappedHandler as any,
      );
    } else {
      server.registerTool(
        name,
        {
          title: config.title,
          description: config.description,
        },
        wrappedHandler as any,
      );
    }
  };

  toolRegistrars.push(register);
  register(mcpServer);

  logger.debug(`Registered raw tool: ${name}`);
}

export function registerPrompt(
  name: string,
  config: {
    title?: string;
    description?: string;
  },
  handler: () => Promise<unknown>,
): void {
  const register = (server: McpServer) => {
    server.registerPrompt(name, config, handler as any);
  };

  promptRegistrars.push(register);
  register(mcpServer);

  logger.debug(`Registered prompt: ${name}`);
}

export async function startStdioMcpServer(): Promise<void> {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  logger.info("MCP server running on stdio");
}

export async function startHttpMcpServer(port?: number): Promise<void> {
  const httpPort = port ?? DEFAULT_HTTP_PORT;
  const sessions = new Map<string, { server: McpServer; transport: HttpTransport }>();

  const createTransport = async (): Promise<HttpTransport> => {
    let transport!: HttpTransport;
    let server!: McpServer;
    transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
      enableJsonResponse: true,
      onsessioninitialized: (sessionId) => {
        sessions.set(sessionId, { server, transport });
        logger.info(`MCP session initialized: ${sessionId}`);
      },
    });

    server = createServerInstance();
    transport.onclose = () => {
      const sessionId = transport.sessionId;
      if (sessionId) {
        sessions.delete(sessionId);
        logger.info(`MCP session closed: ${sessionId}`);
      }
      void server.close().catch((err) => {
        logger.error(
          `Failed to close MCP server for session ${sessionId ?? "unknown"}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      });
    };

    await server.connect(transport);
    return transport;
  };

  const getTransportForRequest = async (
    req: Request,
  ): Promise<
    | { transport: HttpTransport; parsedBody?: unknown }
    | { response: Response }
  > => {
    const sessionId = req.headers.get("mcp-session-id");

    if (sessionId) {
      const session = sessions.get(sessionId);
      if (!session) {
        return {
          response: new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              error: { code: -32001, message: "Session not found" },
              id: null,
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            },
          ),
        };
      }

      return { transport: session.transport };
    }

    if (req.method !== "POST") {
      return {
        response: new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32000,
              message: "Bad Request: No valid session ID provided",
            },
            id: null,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        ),
      };
    }

    let parsedBody: unknown;
    try {
      parsedBody = await req.clone().json();
    } catch {
      return {
        response: new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32700, message: "Parse error: Invalid JSON" },
            id: null,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        ),
      };
    }

    const messages = Array.isArray(parsedBody) ? parsedBody : [parsedBody];
    const isInit =
      messages.length === 1 &&
      (() => {
        try {
          return isInitializeRequest(JSONRPCMessageSchema.parse(messages[0]));
        } catch {
          return false;
        }
      })();

    if (!isInit) {
      return {
        response: new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32000,
              message: "Bad Request: No valid session ID provided",
            },
            id: null,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        ),
      };
    }

    const transport = await createTransport();
    return { transport, parsedBody };
  };

  Bun.serve({
    port: httpPort,
    async fetch(req: Request): Promise<Response> {
      const url = new URL(req.url);
      logger.debug(
        `HTTP ${req.method} ${url.pathname} session=${
          req.headers.get("mcp-session-id") ?? "-"
        } accept=${req.headers.get("accept") ?? "-"} protocol=${
          req.headers.get("mcp-protocol-version") ?? "-"
        }`,
      );

      if (req.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
            "Access-Control-Allow-Headers":
              "Content-Type, mcp-session-id, mcp-protocol-version",
          },
        });
      }

      if (url.pathname === "/mcp") {
        const result = await getTransportForRequest(req);
        if ("response" in result) {
          result.response.headers.set("Access-Control-Allow-Origin", "*");
          result.response.headers.set(
            "Access-Control-Expose-Headers",
            "mcp-session-id",
          );
          return result.response;
        }

        const response = await result.transport.handleRequest(req, {
          parsedBody: result.parsedBody,
        });
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
