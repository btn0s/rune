import type { ServerWebSocket } from "bun";
import type { CommandMessage, ResponseMessage } from "@shared/protocol";
import { logger } from "./logger";

const DEFAULT_PORT = 3055;
const DEFAULT_TIMEOUT_MS = 30_000;

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  timeout: ReturnType<typeof setTimeout>;
}

export interface PluginConnection {
  socket: ServerWebSocket<unknown>;
  fileKey: string;
  fileName: string;
  connectedAt: number;
}

const connections = new Map<string, PluginConnection>();
let activeFileKey: string | null = null;
const pendingRequests = new Map<string, PendingRequest>();

function getActiveConnection(): PluginConnection | null {
  if (activeFileKey) {
    const conn = connections.get(activeFileKey);
    if (conn) return conn;
    activeFileKey = null;
  }
  const first = connections.values().next();
  if (!first.done) {
    activeFileKey = first.value.fileKey;
    return first.value;
  }
  return null;
}

function getConnectionBySocket(ws: ServerWebSocket<unknown>): PluginConnection | null {
  for (const conn of connections.values()) {
    if (conn.socket === ws) return conn;
  }
  return null;
}

export function isPluginConnected(): boolean {
  return connections.size > 0;
}

export function listConnections(): Array<{ fileKey: string; fileName: string; isActive: boolean; connectedAt: number }> {
  return Array.from(connections.values()).map((conn) => ({
    fileKey: conn.fileKey,
    fileName: conn.fileName,
    isActive: conn.fileKey === activeFileKey,
    connectedAt: conn.connectedAt,
  }));
}

export function getActiveFile(): { fileKey: string; fileName: string } | null {
  const conn = getActiveConnection();
  if (!conn) return null;
  return { fileKey: conn.fileKey, fileName: conn.fileName };
}

export function setActiveFile(fileKey: string): { fileKey: string; fileName: string } {
  const conn = connections.get(fileKey);
  if (!conn) {
    throw new Error(`No connection with fileKey "${fileKey}". Use list_connections to see available files.`);
  }
  activeFileKey = fileKey;
  logger.info(`Active file set to "${conn.fileName}" (${fileKey})`);
  return { fileKey: conn.fileKey, fileName: conn.fileName };
}

export function sendCommand(
  type: string,
  params: Record<string, unknown> = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const conn = getActiveConnection();
    if (!conn) {
      reject(new Error("No Figma plugin is connected"));
      return;
    }

    const id = crypto.randomUUID();

    const timeout = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error(`Command "${type}" timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    pendingRequests.set(id, { resolve, reject, timeout });

    const message: CommandMessage = { id, type, params };
    conn.socket.send(JSON.stringify(message));
    logger.debug(`Sent command: ${type} (${id}) → "${conn.fileName}"`);
  });
}

function handlePluginMessage(ws: ServerWebSocket<unknown>, rawMessage: string | Buffer): void {
  try {
    const data = JSON.parse(
      typeof rawMessage === "string" ? rawMessage : rawMessage.toString(),
    );

    if (data.type === "plugin_identity") {
      const { fileKey, fileName } = data;
      if (!fileKey || !fileName) {
        logger.warn("plugin_identity missing fileKey or fileName");
        return;
      }

      connections.set(fileKey, {
        socket: ws,
        fileKey,
        fileName,
        connectedAt: Date.now(),
      });

      if (!activeFileKey) {
        activeFileKey = fileKey;
      }

      logger.info(`Plugin registered: "${fileName}" (${fileKey}) [${connections.size} total]`);
      return;
    }

    if (data.type === "plugin_connected") {
      return;
    }

    const response = data as ResponseMessage;
    if (!response.id) {
      logger.warn(`Received message without id: ${JSON.stringify(data)}`);
      return;
    }

    const pending = pendingRequests.get(response.id);
    if (!pending) {
      logger.warn(`Received response for unknown request: ${response.id}`);
      return;
    }

    clearTimeout(pending.timeout);
    pendingRequests.delete(response.id);

    if (response.error) {
      pending.reject(new Error(response.error));
    } else {
      pending.resolve(response.result);
    }
  } catch (err) {
    logger.error(
      `Failed to parse plugin message: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

function handleSocketClose(ws: ServerWebSocket<unknown>): void {
  const conn = getConnectionBySocket(ws);
  if (!conn) return;

  connections.delete(conn.fileKey);
  if (activeFileKey === conn.fileKey) {
    activeFileKey = null;
  }
  logger.info(`Plugin disconnected: "${conn.fileName}" (${conn.fileKey}) [${connections.size} remaining]`);

  if (connections.size === 0) {
    for (const [, pending] of pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error("All Figma plugins disconnected"));
    }
    pendingRequests.clear();
  }
}

export function startBridge(): void {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_PORT;

  try {
    Bun.serve({
      port,
      fetch(req, server) {
        const upgraded = server.upgrade(req);
        if (upgraded) return undefined;
        return new Response("Rune WebSocket Bridge", { status: 200 });
      },
      websocket: {
        open(_ws: ServerWebSocket<unknown>) {
          logger.info("New WebSocket connection (awaiting identity)");
        },
        message(ws: ServerWebSocket<unknown>, message: string | Buffer) {
          handlePluginMessage(ws, message);
        },
        close(ws: ServerWebSocket<unknown>) {
          handleSocketClose(ws);
        },
      },
    });

    logger.info(`WebSocket bridge listening on ws://localhost:${port}`);
  } catch (err) {
    logger.warn(
      `Bridge failed to start on port ${port} (${err instanceof Error ? err.message : String(err)}). ` +
      `Tools will return "No Figma plugin is connected" until the port is available and the server is restarted.`,
    );
  }
}
