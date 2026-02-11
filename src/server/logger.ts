import { appendFileSync } from "node:fs";
import { join } from "node:path";

const LOG_FILE = join(import.meta.dir, "..", "..", "rune-server.log");

function timestamp(): string {
  return new Date().toISOString();
}

function write(level: string, message: string): void {
  const line = `[${timestamp()}] [${level}] ${message}\n`;
  process.stderr.write(line);
  try {
    appendFileSync(LOG_FILE, line);
  } catch (_) {}
}

export const logger = {
  info: (message: string) => write("INFO", message),
  debug: (message: string) => write("DEBUG", message),
  warn: (message: string) => write("WARN", message),
  error: (message: string) => write("ERROR", message),
};
