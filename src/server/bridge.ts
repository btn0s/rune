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

let pluginSocket: ServerWebSocket<unknown> | null = null;
const pendingRequests = new Map<string, PendingRequest>();

export function isPluginConnected(): boolean {
  return pluginSocket !== null;
}

export function sendCommand(
  type: string,
  params: Record<string, unknown> = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (!pluginSocket) {
      reject(new Error("Figma plugin is not connected"));
      return;
    }

    const id = crypto.randomUUID();

    const timeout = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error(`Command "${type}" timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    pendingRequests.set(id, { resolve, reject, timeout });

    const message: CommandMessage = { id, type, params };
    pluginSocket.send(JSON.stringify(message));
    logger.debug(`Sent command: ${type} (${id})`);
  });
}

function handlePluginMessage(rawMessage: string | Buffer): void {
  try {
    const data = JSON.parse(
      typeof rawMessage === "string" ? rawMessage : rawMessage.toString(),
    ) as ResponseMessage;

    if (!data.id) {
      logger.warn(`Received message without id: ${JSON.stringify(data)}`);
      return;
    }

    const pending = pendingRequests.get(data.id);
    if (!pending) {
      logger.warn(`Received response for unknown request: ${data.id}`);
      return;
    }

    clearTimeout(pending.timeout);
    pendingRequests.delete(data.id);

    if (data.error) {
      pending.reject(new Error(data.error));
    } else {
      pending.resolve(data.result);
    }
  } catch (err) {
    logger.error(
      `Failed to parse plugin message: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

function rejectAllPending(reason: string): void {
  for (const [id, pending] of pendingRequests) {
    clearTimeout(pending.timeout);
    pending.reject(new Error(reason));
  }
  pendingRequests.clear();
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
        open(ws: ServerWebSocket<unknown>) {
          if (pluginSocket) {
            logger.warn("Plugin reconnected — replacing existing connection");
            rejectAllPending("Plugin reconnected");
          }
          pluginSocket = ws;
          logger.info("Figma plugin connected");
        },
        message(ws: ServerWebSocket<unknown>, message: string | Buffer) {
          if (ws === pluginSocket) {
            handlePluginMessage(message);
          }
        },
        close(ws: ServerWebSocket<unknown>) {
          if (ws === pluginSocket) {
            pluginSocket = null;
            rejectAllPending("Figma plugin disconnected");
            logger.info("Figma plugin disconnected");
          }
        },
      },
    });

    logger.info(`WebSocket bridge listening on ws://localhost:${port}`);
  } catch (err) {
    logger.warn(
      `Bridge failed to start on port ${port} (${err instanceof Error ? err.message : String(err)}). ` +
      `Tools will return "Figma plugin is not connected" until the port is available and the server is restarted.`,
    );
  }
}
