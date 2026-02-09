/**
 * Logger utility that writes exclusively to stderr.
 * stdout is reserved for MCP JSON-RPC stdio transport.
 */

function timestamp(): string {
  return new Date().toISOString();
}

export const logger = {
  info: (message: string) =>
    process.stderr.write(`[${timestamp()}] [INFO] ${message}\n`),
  debug: (message: string) =>
    process.stderr.write(`[${timestamp()}] [DEBUG] ${message}\n`),
  warn: (message: string) =>
    process.stderr.write(`[${timestamp()}] [WARN] ${message}\n`),
  error: (message: string) =>
    process.stderr.write(`[${timestamp()}] [ERROR] ${message}\n`),
};
